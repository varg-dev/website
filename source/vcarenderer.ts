/* spellchecker: disable */

// import { mat4, vec3 } from 'webgl-operate';

import { auxiliaries, fetch } from 'webgl-operate';

const log = auxiliaries.log;
const LogLvl = auxiliaries.LogLevel;

import {
    // AccumulatePass,
    // AntiAliasingKernel,
    BlitPass,
    // Camera,
    // Color,
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
    // Navigation,
    NdcFillingTriangle,
    Program,
    // Renderbuffer,
    Renderer,
    Shader,
    Texture2D,
    Wizard,
} from 'webgl-operate';


/* spellchecker: enable */



// tslint:disable:max-classes-per-file

export class VCARenderer extends Renderer {

    protected _source: string = '';
    protected _effect: string = '';

    // protected _navigation: Navigation;
    // protected _camera: Camera;

    protected _texture: Texture2D;

    protected _defaultFBO: Framebuffer;

    protected _intermediateFBO: Framebuffer;
    protected _colorRenderTexture: Texture2D;
    // protected _depthRenderbuffer: Renderbuffer;

    protected _ndcTriangle: NdcFillingTriangle;

    protected _program: Program;
    // protected _uResolution: WebGLUniformLocation;


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

        const gl = context.gl;
        const gl2facade = context.gl2facade;

        this._defaultFBO = new DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        // this._defaultFBO.clearColor([1.0, 0.5, 0.0, 1.0]); // not necessary

        this._ndcTriangle = new NdcFillingTriangle(context);
        this._ndcTriangle.initialize();


        /** The WebGL version and the available extensions might require specific
         *  internal-format to format combinations, e.g., gl.RGBA8 to gl.RGBA which
         *  does not work in WebGL1 ... the canvas precision can be changed ... */
        const rgbaFormat = Wizard.queryInternalTextureFormat(context, gl.RGBA, this._framePrecision);

        this._texture = new Texture2D(context, 'SourceTexture');
        this._texture.initialize(1, 1, // resized later on successful fetch
            rgbaFormat[0], gl.RGBA, rgbaFormat[1]);
        this._texture.filter(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, true, false);
        this._texture.maxAnisotropy(Texture2D.MAX_ANISOTROPY, false, false);


        this._colorRenderTexture = new Texture2D(context, 'ColorRenderTexture');
        this._colorRenderTexture.initialize(1, 1, // resized later on prepare
            rgbaFormat[0], gl.RGBA, rgbaFormat[1]);

        // this._depthRenderbuffer = new Renderbuffer(context, 'DepthRenderbuffer');
        // this._depthRenderbuffer.initialize(1, 1, gl.DEPTH_COMPONENT16);

        this._intermediateFBO = new Framebuffer(context, 'IntermediateFBO');

        this._intermediateFBO.initialize([
            [gl2facade.COLOR_ATTACHMENT0, this._colorRenderTexture]
            /*, [gl.DEPTH_ATTACHMENT, this._depthRenderbuffer] */]);

        this._intermediateFBO.clearColor([0.4, 0.4, 0.4, 1.0]);


        const vert = new Shader(context, gl.VERTEX_SHADER, 'ndctest.vert');
        vert.initialize(require('./shaders/ndctest.vert'));
        const frag = new Shader(context, gl.FRAGMENT_SHADER, 'ndctest.frag');
        frag.initialize(require('./shaders/ndctest.frag'));

        this._program = new Program(context, 'MasterpieceProgram');
        this._program.initialize([vert, frag], true);
        this._program.attribute('a_position', this._ndcTriangle.vertexLocation);
        this._program.link();
        this._program.bind();

        // this._uResolution = this._program.uniform('u_resolution');

        gl.uniform1i(this._program.uniform('u_source'), 0);


        // /* Create and configure camera. */

        // this._camera = new Camera();
        // this._camera.center = vec3.fromValues( 48.0, 10.0, -42.0);
        // this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        // this._camera.eye = vec3.fromValues( 40.0, 128.0, 40.0);
        // this._camera.near = 1.0;
        // this._camera.far = 256.0;

        // /* Create and configure navigation */

        // this._navigation = new Navigation(callback, mouseEventProvider);
        // this._navigation.camera = this._camera;

        // this._accumulate = new AccumulatePass(context);
        // this._accumulate.initialize(this._ndcTriangle);
        // this._accumulate.precision = this._framePrecision;
        // this._accumulate.texture = this._colorRenderTexture[0];


        this._blit = new BlitPass(context);
        this._blit.initialize(this._ndcTriangle);

        this._blit.framebuffer = this._intermediateFBO;
        this._blit.readBuffer = gl2facade.COLOR_ATTACHMENT0;

        this._blit.target = this._defaultFBO;
        this._blit.drawBuffer = gl.BACK;


        auxiliaries.logVerbosity(LogLvl.Debug); // for performance logging

        log(LogLvl.Info, context.allocationRegister.bytesToString());
        log(LogLvl.Info, context.allocationRegister.toString());


        return true;
    }

    /**
     * Uninitializes Buffers, Textures, and Program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._defaultFBO.uninitialize();
        this._ndcTriangle.uninitialize();

        this._texture.uninitialize();
        this._program.uninitialize();

        this._blit.uninitialize();
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
            this._intermediateFBO.resize(this._frameSize[0], this._frameSize[1], true, false);
            // this._texture.bind(gl.TEXTURE0);        this._intermediateFBO.bind();

            // this._texture.bind(gl.TEXTURE0);
            // this._program.bind();

            // this._ndcTriangle.bind();

            gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);

            // // this._program.bind()
            // gl.uniform2f(this._uResolution, this._frameSize[0], this._frameSize[1]);
            // // this._program.unbind()
        }

        // if (this._altered.canvasSize) {
        //     this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        // }

        // if (this._altered.clearColor) {
        //     // this._defaultFBO.clearColor(this._clearColor);
        //     // this._intermediateFBO.clearColor(this._clearColor);
        // }

        this._altered.reset();
    }

    protected onFrame(frameNumber: number): void {

        // create performance counter that can be logged and is tracked by chrome/firefox performance recorders ;)
        auxiliaries.logPerformanceStart('draw');


        const gl = this._context.gl as WebGLRenderingContext;

        this._intermediateFBO.bind();
        // this._intermediateFBO.clear(gl.COLOR_BUFFER_BIT /* | gl.DEPTH_BUFFER_BIT */, true, false);

        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);

        this._program.bind();
        this._texture.bind(gl.TEXTURE0);

        this._ndcTriangle.bind();
        this._ndcTriangle.draw()


        gl.finish(); // try persuading the browser to actually block until webgl is done (probably ignored)
        auxiliaries.logPerformanceStop('draw', undefined);
    }

    /*
        some fun for the console:

        canvas.frameScale = [0.125, 0.125]; // reduces rendering scale to 1/8
        renderer.invalidate(true); // force new frame

    */

    protected onSwap(): void {
        // this._blit.framebuffer = this._accumulate.framebuffer ?
        //     this._accumulate.framebuffer : this._intermediateFBO;

        // this blit is automatically selects the best implementation available on the client ...
        // note: this could bind a program and other geometry depending on the implementation used.
        this._blit.frame();
    }


    get source(): string {
        return this._source;
    }

    set source(uri: string) {
        if (this._source.localeCompare(uri) === 0) {
            return;
        }
        if (!this._texture || this._texture.initialized == false) {
            return;
        }

        this._source = uri;
        this._texture.fetch(this._source).then(() => {
            log(LogLvl.Info, this._context.allocationRegister.bytesToString());
            log(LogLvl.Info, this._context.allocationRegister.toString());
            this.invalidate(true); // trigger re-rendering
        });
    }

    // private static readonly SCHEMA: any = require('./data/moep.schema.json');

    set effect(uri: string) {

        if (this._effect.localeCompare(uri) === 0) {
            return;
        }

        if (this.initialized === false) {
            log(LogLvl.Error, 'MOEP! probaly call initialize on renderer first');
            return;
        }

        this._effect = uri;


        const transform = (data: any): RenderPass | undefined => {

            const pass = new RenderPass();

            const programs = data.vca.effectdef.implset.implementations
                .target.impl.effectimpl.targets.target.shaderprograms;

            if (Array.isArray(programs)) {
                log(LogLvl.Warning, `shader program arrays not implemented yet, sorry.`);
                return undefined;
            }


            const createAndCompileShaderFromEffect = (type: GLenum, shader: EffectShader | Array<EffectShader>): Shader => {

                let source = Array.isArray(shader) ?
                    shader.reduce((source: string, element: EffectShader) => source + element.text, '') :
                    shader.text;

                /** @todo for now remove the first line, this is due to a design issue with webgl shader,
                 * that always adds the version line when in webgl2 ... should be removed in json, since
                 * version is stored explicitly, and for multiple shaders, only the first has version
                 * string which seems inconsistent (probably also generated by exporter) ...
                 */
                source = source.substring(source.indexOf("\n") + 1)

                const s = new Shader(this._context, type, (Array.isArray(shader) ? shader[0] : shader).file);
                s.initialize(source);

                return s;
            };

            const gl = this._context.gl;

            const effectProgram = programs.shaderprogram as EffectProgram;
            const vert = createAndCompileShaderFromEffect(gl.VERTEX_SHADER, effectProgram.vertexshader);
            const frag = createAndCompileShaderFromEffect(gl.FRAGMENT_SHADER, effectProgram.fragmentshader);

            // could also create a new program... but this is how relink would look like:
            this._program.detach(this._program.shaders);
            this._program.uninitialize();


            this._program.initialize([vert, frag], true);
            this._program.attribute('a_Position', this._ndcTriangle.vertexLocation);

            this._program.bind();
            gl.uniform1i(this._program.uniform('u_Texture'), 0);
            gl.uniform1i(this._program.uniform('u_NumberOfIterations'), 17);
            gl.uniform1f(this._program.uniform('u_MaximalDistortion'), 0.5);

            return pass;
        };
        fetch.fetchJsonAsync<RenderPass>(uri, transform /*, VCARenderer.SCHEMA */)
            .then((value: RenderPass) => {
                log(LogLvl.Info, `successfully loaded a masterpiece from '${uri}'`);

                /** this would be the time to update the rendering pipeline, instead of accessing the
                 *  current program in the transform, a pass object could be created and swapped out.
                 */
                this.invalidate(true)

            }).catch((reason: any) => {
                log(LogLvl.Warning, `loading a masterpiece from '${uri}' has failed`);
            });
    }

}


interface EffectShader {

    file: string;
    text: string;
}

interface EffectProgram {

    id: string;
    type: 'GLSL' | undefined;
    version: '300' | undefined;

    vertexshader: EffectShader | Array<EffectShader>;
    fragmentshader: EffectShader | Array<EffectShader>;
}

class RenderPass {


}

