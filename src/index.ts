import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IRenderMimeRegistry, MimeModel
} from '@jupyterlab/rendermime'

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  INotebookTracker
} from '@jupyterlab/notebook'

import {
  VirtualDOM, h,
} from '@phosphor/virtualdom';

import {
  Widget
} from '@phosphor/widgets';

import {
  ServerConnection
} from '@jupyterlab/services';

import {
  URLExt
} from '@jupyterlab/coreutils';


class NbViewWidget extends Widget {

  private serverSettings: ServerConnection.ISettings

  constructor(path:string, rendermime: IRenderMimeRegistry) {
    super();
    this.serverSettings = ServerConnection.makeSettings();
    this.id = 'asdf';
    this.title.label = 'asdfadsfdasf';
    this.title.closable = true;
    this.addClass('jp-asdf');
    let title = VirtualDOM.realize(h.h1(path))
    let content = VirtualDOM.realize(h.div())
    this.node.appendChild(title)
    this.node.appendChild(content)
    this.nbconvertRequest('pdfdesignnote', path).then((response)=>{
      let mimetype:string = response.headers.get('Content-Type').split(';')[0]
      let renderer = rendermime.createRenderer(mimetype)
      response.blob().then((blob)=> {
        console.log(mimetype)
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = function () {
          let thedata:{[mimetype:string]:string} = {}
          thedata[mimetype] = reader.result.split(',')[1]
          console.log(thedata)
          let newmodel = new MimeModel({trusted:true,data:thedata})
          console.log(newmodel)
          renderer.renderModel(newmodel)
        }


      })
      content.appendChild(renderer.node)
      console.log(renderer)
    })
  }

  nbconvertRequest(format: string, path:string): Promise<Response> {
    let fullUrl = URLExt.join(this.serverSettings.baseUrl, 'nbconvert', format, path);
    return ServerConnection.makeRequest(fullUrl, {}, this.serverSettings)
  }

};

function activateNbViewPlugin(app: JupyterLab, tracker: INotebookTracker, rendermime: IRenderMimeRegistry, docmanager: IDocumentManager): void {

  app.commands.addCommand('NbView:Open', {
    execute: () => {
      let nbWidget = tracker.currentWidget
      console.log(nbWidget)
      let nbContext = docmanager.contextForWidget(nbWidget);
      let viewWidget = new NbViewWidget(nbContext.path, rendermime)
      app.shell.addToMainArea(viewWidget);
      nbWidget.update();
      app.shell.activateById(viewWidget.id);
      console.log(nbWidget)
      console.log(nbContext)
      console.log(viewWidget)

     },
    isEnabled: () => true,
    isVisible: () => true,
    label: 'Show NBView'
  });

  app.contextMenu.addItem({
    command: 'NbView:Open',
    selector: '.jp-Notebook'
  });
}

const nbViewPlugin: JupyterLabPlugin<void> = {
  id: 'nbViewPlugin',
  requires: [
    INotebookTracker,
    IRenderMimeRegistry,
    IDocumentManager,
  ],
  activate: activateNbViewPlugin,
  autoStart: true
};

export default nbViewPlugin;
