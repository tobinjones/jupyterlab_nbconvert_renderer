import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import {
  RenderMimeRegistry
} from '@jupyterlab/rendermime';


import {
  Widget
} from '@phosphor/widgets';

import {
  VirtualDOM, h,
} from '@phosphor/virtualdom';

import {
  ServerConnection
} from '@jupyterlab/services';

import {
  URLExt
} from '@jupyterlab/coreutils';
import { ReadonlyJSONValue } from '@phosphor/coreutils';
/*
import {
  OutputArea
} from '@jupyterlab/outputarea'
*/

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/x-ipynb+json';


/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'jp-OutputWidgetnotebook';


/**
 * A widget for rendering notebook.
 */
export
class OutputWidget extends Widget implements IRenderMime.IRenderer {

  private serverSettings: ServerConnection.ISettings

  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.serverSettings = ServerConnection.makeSettings();
    this.addClass(CLASS_NAME);
    this._format_option = VirtualDOM.realize(h.select([
      h.option({value:"html"},"HTML"),
      h.option({value:"asciidoc"},"AsciiDoc"),
      h.option({value:"slides"},"Slides"),
      h.option({value:"pdfdesignnote"},"Design Note")
      ])) as HTMLSelectElement
    let toolbar = VirtualDOM.realize(h.div())
    toolbar.appendChild(this._format_option)
    this._content = VirtualDOM.realize(h.div())
    this.node.appendChild(toolbar)
    this.node.appendChild(this._content)
  }

  nbconvertRequest(format: string, notebook:ReadonlyJSONValue): Promise<Response> {
    let fullUrl = URLExt.join(this.serverSettings.baseUrl, 'nbconvert_json', format);
    console.log(notebook)
    return ServerConnection.makeRequest(fullUrl, {method:'POST', body:JSON.stringify(notebook)}, this.serverSettings)
  }

  /**
   * Render notebook into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    let notebook_json = model.data[this._mimeType]
    let format:string = this._format_option.value;
    this.nbconvertRequest(format, notebook_json).then((response)=>{
      let mimetype = response.headers.get('Content-Type').split(';')[0]
      response.text().then( (value) => {
        let rendermime = new RenderMimeRegistry()
        let renderer = rendermime.createRenderer(mimetype)
        let new_model:IRenderMime.IMimeModel = {
          trusted:true,
          data:{mimetype:value},
          metadata:model.metadata,
          setData:(value)=>{}
        }
        this._content.innerHTML = '';
        this._content.appendChild(renderer.node)
        renderer.renderModel(new_model)
      
      })
    })
    return Promise.resolve(void 0);
  }

  private _content: HTMLElement;
  private _format_option: HTMLSelectElement;
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

