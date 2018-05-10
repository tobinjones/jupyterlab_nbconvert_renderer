import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import {
  Widget
} from '@phosphor/widgets';

import {
  VirtualDOM, h
} from '@phosphor/virtualdom';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/x-ipynb+json';
//const MIME_TYPE = 'application/x-asdf';


/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'jp-OutputWidgetnotebook';


/**
 * A widget for rendering notebook.
 */
export
class OutputWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  /**
   * Render notebook into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    let title = VirtualDOM.realize(h.h1("Hello"))
    let content = VirtualDOM.realize(h.div())
    this.node.appendChild(title)
    this.node.appendChild(content)
    console.log(this);
    console.log(model);
    content.textContent = JSON.stringify(model.data[this._mimeType]);
    return Promise.resolve(void 0);
  }

  private _mimeType: string;
}


/**
 * A mime renderer factory for notebook data.
 */
export
const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  defaultRank: 99,
  createRenderer: options => new OutputWidget(options)
};

const extension: IRenderMime.IExtension = {
  id: 'jupyterlab_nbconvert_renderer:plugin',
  rendererFactory,
  rank: 99,
  dataType: 'json',
  documentWidgetFactoryOptions: [{
    name: 'NBConvertView',
    primaryFileType: 'notebook',
    fileTypes: ['notebook']
  }]
};

export default extension;

