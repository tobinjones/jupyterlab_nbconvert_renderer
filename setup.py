from setuptools import setup, find_packages

setup(
    name='jupyterlab_nbconvert_renderer',
    version=0.1,
    description='A Jupyter Notebook server extension which acts as an endpoint for NBConvert',
    packages=find_packages(),
    author          = 'Tobin Jones',
    author_email    = 'jones@tobin.nz',
    url             = 'https://github.com/tobinjones/jupyterlab_nbconvert_renderer',
    license         = 'BSD',
    platforms       = "Linux, Mac OS X, Windows",
    keywords        = ['Jupyter', 'JupyterLab', 'NBConvert'],
    python_requires = '>=3.6',
    classifiers     = [
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
    ],
    install_requires=[
        'notebook'
    ],
)