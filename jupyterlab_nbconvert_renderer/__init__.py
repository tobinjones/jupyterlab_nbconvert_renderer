from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import IPythonHandler
from tornado import web, escape
import nbformat
from notebook.nbconvert import handlers
import os

path_regex = r"(?P<path>(?:/.*)*)"

class NBConvertHandler(IPythonHandler):
    @web.authenticated
    def post(self, path):
        fmt = path.strip('/')
        content = self.request.body
        model = nbformat.reads(self.request.body, 4)
        name = 'asdf.ipynb'
        exporter = handlers.get_exporter(fmt, config=self.config)

        try:
            output, resources = exporter.from_notebook_node(
                model,
                resources={
                    "metadata": {
                        "name": name[:name.rfind('.')],
                    },
                    "config_dir": self.application.settings['config_dir'],
                }
            )
        except Exception as e:
            raise web.HTTPError(500, "nbconvert failed: %s" % e)
        
        filename = os.path.splitext(name)[0] + resources['output_extension']
        self.set_header('Content-Disposition', 'inline; filename="%s"' % escape.url_escape(filename))

        if exporter.output_mimetype:
            self.set_header('Content-Type','%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)

def load_jupyter_server_extension(nbapp):
    webapp = nbapp.web_app
    base_url = webapp.settings['base_url']
    handler_string = r"/nbconvert_json{:s}".format(path_regex)
    webapp.add_handlers(".*$", [(ujoin(base_url, handler_string), NBConvertHandler),])