# -*- coding: utf-8 -*-
{
    'name': 'EESTISOFT scroll loading',
    'author': 'EESTISOFT, Hideki Yamamoto',
    'website': 'http://www.eestisoft.com',

    'summary': 'Adds loading of new records for kanban and tree views',

    'description': "Automatically load more records on scroll in any search view"
                   "============================================================"
                   "Adds loading of new records for kanban and tree views"
                   ""
                   "Usage:"
                   "1 - Install module"
                   "2 - Restart odoo service - this is important for some reason"
                   "3 - Clear browser cache and go to any odoo page with a search view and more than 80 results"
                   "4 - Scroll down and notice loading of new records"
                   ""
                   "Made with love.",

    'version': '12.0.1.0',
    'category': 'Productivity',

    'depends': ['web'],
    'installable': True,
    'application': True,
    'auto_install': False,

    'images': [
        'static/description/thumb.png',
    ],
    'data': [
        'views/ees_scroll_load.xml',
    ],
    'qweb': [
        'static/src/xml/ees_scroll_load.xml',
    ],
}
