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
  INotebookTracker, NotebookPanel, INotebookModel
} from '@jupyterlab/notebook'

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  VirtualDOM, h,
} from '@phosphor/virtualdom';

import {
  Widget
} from '@phosphor/widgets';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  ServerConnection
} from '@jupyterlab/services';

import {
  URLExt, PathExt
} from '@jupyterlab/coreutils';

import '../style/index.css';
import { DocumentRegistry } from '@jupyterlab/docregistry';

class NbViewWidget extends Widget {

  private serverSettings: ServerConnection.ISettings
  private outputSelect: HTMLSelectElement
  private contentDiv: HTMLDivElement
  private renderMimeRegistry: IRenderMimeRegistry
  private docContext:DocumentRegistry.IContext<DocumentRegistry.IModel>
  private spinnerDiv:HTMLDivElement

  constructor(docContext:DocumentRegistry.IContext<DocumentRegistry.IModel>, renderMimeRegistry: IRenderMimeRegistry) {
    super();
    // Interfaces
    this.docContext = docContext;
    this.renderMimeRegistry = renderMimeRegistry
    this.serverSettings = ServerConnection.makeSettings();
    // Widget IDs
    this.id = 'nbViewWidget';
    this.title.label = PathExt.basename(this.nbPath(), '.ipynb')
    this.title.closable = true;
    // Output widget
    this.addClass('jp-nbviewwidget');
    this.outputSelect = VirtualDOM.realize(h.select([
      h.option({value:"html"}, "HTML"),
      h.option({value:"pdfdesignnote"}, "Design Note"),
    ])) as HTMLSelectElement
    this.contentDiv = VirtualDOM.realize(h.div()) as HTMLDivElement
    let toolbarDiv = VirtualDOM.realize(h.div()) as HTMLDivElement
    this.contentDiv.classList.add('jp-nbviewContent')
    toolbarDiv.classList.add('jp-Toolbar')
    this.spinnerDiv = VirtualDOM.realize(h.div()) as HTMLDivElement
    toolbarDiv.appendChild(this.outputSelect)
    toolbarDiv.appendChild(this.spinnerDiv)
    this.node.appendChild(toolbarDiv)
    this.node.appendChild(this.contentDiv)
    // Events
    this.outputSelect.onchange = (ev: Event) => {this.updateContent()}
    this.docContext.fileChanged.connect((sender,args)=>{this.updateContent()})
    this.docContext.pathChanged.connect((sender,args)=>{this.updateContent()})
    this.updateContent()
  }

  nbPath(): string {
    return this.docContext.path
  }

  chosenOutputType(): string {
    return this.outputSelect.value
  }

  updateContent(): void {
    this.spinnerDiv.classList.add('jp-nbviewSpinner')
    this.nbconvertRequest(this.chosenOutputType(), this.nbPath()).then((response)=>{
      let mimetype:string = response.headers.get('Content-Type').split(';')[0]
      let renderer = this.renderMimeRegistry.createRenderer(mimetype)
      response.blob().then((blob)=> {
        const reader = new FileReader()
        if(mimetype.match("text/.*")){
          reader.readAsText(blob)
        } else {
          reader.readAsDataURL(blob)
        }
        reader.onloadend = function () {
          let thedata:{[mimetype:string]:string} = {}
          if(mimetype.match("text/.*")){
            thedata[mimetype] = reader.result
          } else {
            thedata[mimetype] = reader.result.split(',')[1]
          }
          let newmodel = new MimeModel({trusted:true,data:thedata})
          renderer.renderModel(newmodel)
        }
      })
      this.contentDiv.innerHTML=""
      this.contentDiv.appendChild(renderer.node)
      this.spinnerDiv.classList.remove('jp-nbviewSpinner')
    })
  }

  nbconvertRequest(format: string, path:string): Promise<Response> {
    let fullUrl = URLExt.join(this.serverSettings.baseUrl, 'nbconvert', format, path);
    return ServerConnection.makeRequest(fullUrl, {}, this.serverSettings)
  }

};


/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export
class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  private action: ()=>void

  constructor(action: ()=>void){
    this.action=action
  }

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    let button = new ToolbarButton({
      className: 'jp-NbViewIcon',
      onClick: this.action,
      tooltip: 'Show NBView'
    });

    let i = document.createElement('i');
    i.classList.add('fa', 'fa-book-open');
    button.node.appendChild(i);

    panel.toolbar.insertItem(8, 'showNbView', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}


function activateNbViewPlugin(app: JupyterLab, tracker: INotebookTracker, rendermime: IRenderMimeRegistry, docmanager: IDocumentManager): void {

  app.commands.addCommand('NbView:Open', {
    execute: () => {
      let nbWidget = tracker.currentWidget
      let nbContext = docmanager.contextForWidget(nbWidget);
      let viewWidget = new NbViewWidget(nbContext, rendermime)
      app.shell.addToMainArea(viewWidget);
      nbWidget.update();
      app.shell.activateById(viewWidget.id);

     },
    isEnabled: () => true,
    isVisible: () => true,
    label: 'Show NBView'
  });

  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(()=>{app.commands.execute('NbView:Open')}));

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
