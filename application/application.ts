/* spellchecker: disable */

import { gloperate, VCARenderer } from 'renderlib';

/* spellchecker: enable */


export class Application {

    private _canvas: gloperate.Canvas;
    private _renderer: VCARenderer;

    initialize(element: HTMLCanvasElement | string): boolean {

        this._canvas = new gloperate.Canvas(element, { antialias: false });

        const aboutCode = window.document.getElementById('context-about');
        aboutCode.innerText = this._canvas.context.aboutString();

        this._canvas.controller.multiFrameNumber = 1;
        this._canvas.framePrecision = gloperate.Wizard.Precision.half;
        this._canvas.frameScale = [1.0, 1.0];

        this._renderer = new VCARenderer();
        this._canvas.renderer = this._renderer;

        return true;
    }

    uninitialize(): void {
        this._canvas.dispose();
        (this._renderer as gloperate.Renderer).uninitialize();
    }

    enableFullscreenOnCtrlClick(): void {

        const e = this.canvas.element;
        e.addEventListener('click', (event: any) => {
            if (event.ctrlKey) { gloperate.viewer.Fullscreen.toggle(e); }
        });
    }

    get canvas(): gloperate.Canvas {
        return this._canvas;
    }

    get renderer(): VCARenderer {
        return this._renderer;
    }

}


declare let window: any;

window.onload = () => {

    const application = new Application();
    application.initialize('canvas');

    application.enableFullscreenOnCtrlClick();

    // expose canvas, context, and renderer for console access
    window.canvas = application.canvas;
    window.context = application.canvas.context;
    window.renderer = application.renderer;

    application.renderer.source = '/img/2yfxvt.png';
    application.renderer.effect = '/data/chromatic_aberration.json';
};

