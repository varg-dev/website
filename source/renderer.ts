/* spellchecker: disable */

// import { /* mat4, */ vec3 } from 'webgl-operate';

import {
    // AccumulatePass,
    // AntiAliasingKernel,
    BlitPass,
    // Camera,
    Context,
    DefaultFramebuffer,
    EventProvider,
    // ForwardSceneRenderPass,
    Framebuffer,
    // Geometry,
    // GLTFLoader,
    // GLTFPbrMaterial,
    Invalidate,
    // Material,
    // MouseEventProvider,
    // Navigation,
    NdcFillingTriangle,
    Program,
    // Renderbuffer,
    Renderer,
    Shader,
    Texture2D,
} from 'webgl-operate';

/* spellchecker: enable */

export class TestRenderer extends Renderer {

    // protected _navigation: Navigation;
    // protected _camera: Camera;


    protected _texture: Texture2D;
    protected _source: string = '';

    protected _defaultFBO: Framebuffer;

    protected _intermediateFBO: Framebuffer;
    protected _colorRenderTexture: Texture2D;
    // protected _depthRenderbuffer: Renderbuffer;

    protected _ndcTriangle: NdcFillingTriangle;

    protected _program: Program;
    // protected _uModel: WebGLUniformLocation;
    // protected _uViewProjection: WebGLUniformLocation;
    protected _uResolution: WebGLUniformLocation;


    // protected _accumulate: AccumulatePass;
    protected _blit: BlitPass;

    /**
     * Initializes and sets up rendering passes, navigation, loads a font face and links shaders with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param mouseEventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(context: Context, callback: Invalidate,
        eventProvider: EventProvider): boolean {

        const gl = this._context.gl;
        const gl2facade = this._context.gl2facade;

        this._defaultFBO = new DefaultFramebuffer(this._context, 'DefaultFBO');
        this._defaultFBO.initialize();

        this._ndcTriangle = new NdcFillingTriangle(this._context);
        this._ndcTriangle.initialize();


        this._texture = new Texture2D(this._context, 'SourceTexture');
        this._texture.initialize(1, 1, // resized later on prepare
            this._context.isWebGL2 ? gl.RGBA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
        this._texture.filter(gl.LINEAR, gl.LINEAR);


        this._colorRenderTexture = new Texture2D(this._context, 'ColorRenderTexture');
        this._colorRenderTexture.initialize(1, 1, // resized later on prepare
            this._context.isWebGL2 ? gl.RGBA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);

        // this._depthRenderbuffer = new Renderbuffer(this._context, 'DepthRenderbuffer');
        // this._depthRenderbuffer.initialize(1, 1, gl.DEPTH_COMPONENT16);

        this._intermediateFBO = new Framebuffer(this._context, 'IntermediateFBO');

        this._intermediateFBO.initialize([
            [gl2facade.COLOR_ATTACHMENT0, this._colorRenderTexture]
            /*, [gl.DEPTH_ATTACHMENT, this._depthRenderbuffer] */]);

        this._intermediateFBO.clearColor(this._clearColor);


        const vert = new Shader(context, gl.VERTEX_SHADER, 'ndctest.vert');
        vert.initialize(require('./shaders/ndctest.vert'));
        const frag = new Shader(context, gl.FRAGMENT_SHADER, 'ndctest.frag');
        frag.initialize(require('./shaders/ndctest.frag'));

        this._program = new Program(context, 'NdcTestProgram');
        this._program.initialize([vert, frag], true);
        this._program.attribute('a_position', this._ndcTriangle.vertexLocation);
        this._program.link();
        this._program.bind();

        // this._uModel = this._program.uniform('u_model');
        // this._uViewProjection = this._program.uniform('u_viewProjection');
        this._uResolution = this._program.uniform('u_resolution');

        gl.uniform1i(this._program.uniform('u_source'), 0);


        // /* Create and configure camera. */

        // this._camera = new Camera();
        // this._camera.center = vec3.fromValues( 48.0, 10.0, -42.0);
        // this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        // this._camera.eye = vec3.fromValues( 40.0, 128.0, 40.0);
        // this._camera.near = 1.0;
        // this._camera.far = 256.0;

        // /* Create and configure navigation */

        // this._navigation = new Navigation(callback, pointEventProvider.mouseEventProvider);
        // this._navigation.camera = this._camera;


        // this._accumulate = new AccumulatePass(context);
        // this._accumulate.initialize(this._ndcTriangle);
        // this._accumulate.precision = this._framePrecision;
        // this._accumulate.texture = this._colorRenderTexture[0];


        this._blit = new BlitPass(this._context);
        this._blit.initialize(this._ndcTriangle);

        this._blit.framebuffer = this._intermediateFBO;
        this._blit.readBuffer = gl2facade.COLOR_ATTACHMENT0;

        this._blit.target = this._defaultFBO;
        this._blit.drawBuffer = gl.BACK;


        return true;
    }

    /**
     * Uninitializes Buffers, Textures, and Program.
     */
    protected onUninitialize(): void {
        super.uninitialize();
    }

    protected onDiscarded(): void { }

    /**
     * This is invoked in order to check if rendering of a frame is required by means of implementation specific
     * evaluation (e.g., lazy non continuous rendering). Regardless of the return value a new frame (preparation,
     * frame, swap) might be invoked anyway, e.g., when update is forced or canvas or context properties have
     * changed or the renderer was invalidated @see{@link invalidate}.
     * Updates the navigaten and the AntiAliasingKernel.
     * @returns whether to redraw
     */
    protected onUpdate(): boolean {

        // this._navigation.update();
        return this._altered.any; // || this._camera.altered;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames, regarding multi-frame rendering and
     * camera-updates.
     */
    protected onPrepare(): void {
        const gl = this._context.gl;

        if (this._altered.frameSize) {
            this._intermediateFBO.resize(this._frameSize[0], this._frameSize[1]);

            this._program.bind()
            gl.uniform2f(this._uResolution, this._frameSize[0], this._frameSize[1]);
            this._program.unbind()

            // this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        // if (this._altered.canvasSize) {
        //     this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        // }

        if (this._altered.clearColor) {
            // this._defaultFBO.clearColor(this._clearColor);
            this._intermediateFBO.clearColor(this._clearColor);
        }

        // this._accumulate.update();

        this._altered.reset();
        // this._camera.altered = false;
    }

    protected onFrame(frameNumber: number): void {
        const gl = this._context.gl as WebGLRenderingContext;

        // rendering
        this._intermediateFBO.clear(gl.COLOR_BUFFER_BIT /* | gl.DEPTH_BUFFER_BIT*/, true, false);

        gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);


        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);

        // this._assetProgram.bind();
        // this._assetPass.frame();
        // // this._assetProgram.unbind();

        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);


        // POST-PROCESSING

        this._texture.bind(gl.TEXTURE0);
        this._ndcTriangle.bind();


        this._program.bind();
        this._ndcTriangle.draw()
        // this._program.unbind();


        // this._accumulate.frame(frameNumber);
    }

    protected onSwap(): void {
        // this._blit.framebuffer = this._accumulate.framebuffer ?
        //     this._accumulate.framebuffer : this._intermediateFBO;
        this._blit.frame();
    }


    get source(): string {
        return this._source;
    }

    set source(source: string) {
        if (this._source.localeCompare(source) === 0) {
            return;
        }
        this._source = source;

        if (this._texture && this._texture.initialized) {
            this._texture.fetch(this._source).then(() => { this.invalidate(true); });
        }
    }


    // protected loadAssets(): void {
    //     const uri = '/data/asset-60.glb';
    //     this._assetPass.scene = undefined;

    //     this._loader.uninitialize();
    //     this._loader.loadAsset(uri)
    //         .then(() => {
    //             this._assetPass.scene = this._loader.defaultScene;
    //             this.invalidate(true);
    //         });
    // }
}
