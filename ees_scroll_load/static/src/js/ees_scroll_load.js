// -*- coding: utf-8 -*-
// © 2018 Eestisoft - Hideki Yamamoto
// License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

odoo.define('ees_scroll_load.overloads', function(require) {
	"use strict";

	// IDK why they include these other renderers and core. They aren't used here, only BasicController.
	var core = require('web.core'),
		ListRenderer = require('web.ListRenderer'),
		KanbanRenderer = require('web.KanbanRenderer'),
		BasicController = require('web.BasicController');

	BasicController.include({
		// Private method override
		_updatePager: function() {
			// Execute base class + inherited others before this
			this._super();
			var view = this;

			// Determine if the user preference has been set
			// This is an async function, so we want to infinite scroll or not when this finishes
			this._rpc({
				model: 'res.users',
				method: 'has_boolean_enabled',
				args: ['toggle_infinite_scrolling'],
			}).then(function(result){
				if (result) {
					setTimeout(
						// Fancy ES6 Anonymous function
						() => {
							// Scroll Spy the pager
							ees.scroll_load.setupscroll(view);
						}, 500 // After half of a second has passed
					);
				}
			})
		},
	});
});

// Create the `ees` base class if it doesn't exist
try {
	ees.test = false;
	delete ees.test;
} catch {
	window.ees = {};
}

// `ees.scroll_load` sub-class
ees.scroll_load = {
	loading: false,
	// Replaces the max-record count from the pager with a link
	// The link will load in all of the records (that match current context)
	// and set pager range to all records
	loadall: function(linkelm) {
		jQuery('.o_pager_value').click();
		setTimeout(
			() => {
				// Interacting with the DOM directly instead of via a traditional web client plugin
				// Gets the current range of records shown in the pager
				jQuery('.o_pager_value .o_input').focus();
				var x = jQuery('.o_pager_value .o_input').get(0);
				var intval = parseInt(linkelm.firstChild.innerHTML);
				var doit = true;

				// There are more than 5000 records in the view
				if (intval > 5000) {
					if (!confirm('This search includes ' + intval + ' records and could require some minutes, do you want to proceed?')) {
						doit = false;
					}
				}
				if (doit && x !== undefined) {
					// Create a new range from start to existing end (why not use `intval` here?)
					x.value = '1-' + linkelm.firstChild.innerHTML;
				}
				jQuery('.o_pager_value .o_input').blur();
			}, 100 // After a 10th of a second has passed since clicking the pager
		);
	},
	// Adds a scroll event listener to at least One element from the view, but up to Three.
	setupscroll: function(view) { 
		var doit = true;
		// Getting the same element from the view, twice?
		var elm = view.$el.get(0);
		var elm2 = view.$el.get(0);

		// This combination of try-catch-if statements seems to be a sort of
		// finding a needle in a haystack type of deal that could have been
		// simplifid with a function or two and a case switch
		// The way that this is structured, we /should/ get a scroll event on at least
		// One element, but can get the scroll event on up to Three different elements

		// If there is no grandparent, don't scrollspy
		try {
			elm = elm.parentNode.parentNode;
		} catch(ex) {
			doit = false;
		}

		// Setup a scroll spy on the element (grandparent above)
		if (doit) {
			elm = jQuery(elm);
			// Kill anything else listening for a scroll event on that element
			elm.off('scroll');
			elm.on('scroll', (ev) => {
				// When there is a scroll event on that element, save the values
				ees.scroll_load.checkscroll(ev, view);
			});
		}

		doit = true;
		// If there is no great-great-grandparent (wtf is this), don't scrollspy
		try {
			elm2 = elm2.parentNode.parentNode.parentNode.parentNode;
		} catch(exx) {
			doit = false;
		}

		// Setup a scroll spy on the element (great-great-grandparent above)
		if (doit) {
			elm2 = jQuery(elm2);
			// Again killing anything that might be listening here
			elm2.off('scroll');
			elm2.on('scroll', (ev) => {
				// When there is a scroll event on that element, save the values
				ees.scroll_load.checkscroll(ev, view);
			});
		}

		doit = true;
		// If there is no parent, don't scrollspy
		try {
			elm2 = view.el.parentNode;
		} catch(exx) {
			doit = false;
		}

		// Setup a scroll spy on the element (parent above)
		if (doit) {
			elm2 = jQuery(elm2);
			// For the final time, killing anything that might be listening on this element
			elm2.off('scroll');
			elm2.on('scroll', (ev) => {
				// When there is a scroll event on that element, save the values
				ees.scroll_load.checkscroll(ev, view);
			});
		}
	},
	// Determines how much the user has scrolled in the page
	checkscroll: function(ev, view) {
		// Determining current pagination values from the view's state
		var CT = view.renderer.state.count;
		var DC = view.renderer.state.data.length;

		// We have less records on screen than the total
		if (DC < CT) {
			// Get current scroll values
			var oh = ev.currentTarget.offsetHeight;
			var h = ev.currentTarget.scrollHeight;
			var t = ev.currentTarget.scrollTop;
			// Used to determine renderable screen height?
			var bh = oh / (h / oh);

			// Determine if the scroll position is near the bottom of the view
			if ((h - t) < (bh * (h / oh)) + 100) {
				// Load more records, but not how you'd expect like from an RPC request
				ees.scroll_load.loadmore(view.renderer);
			}
		}
	},
	// Triggered by scroll event from one to three elements (only one should succeed)
	// Loads in the next 80 (or remaining if less than 80) records that match the context
	loadmore: function(listrenderer) {
		// Only if the view is not currently loading
		if (!ees.scroll_load.loading) {
			// Flag to prevent this from getting called more than once
			// This is why it doesn't matter to have multiple scroll listeners above
			ees.scroll_load.loading = true;
			var doit = true;
			// wat
			var elm = jQuery(listrenderer.$el.get()).get(0);

			// Get the great-great-grandparent
			try {
				elm = elm.parentNode.parentNode.parentNode.parentNode;
			} catch(ex) {
				doit = false;
			}

			if (doit){
				// Click on the pager
				jQuery('.o_pager_value').click();
				setTimeout(
					() => {
						// Very similar to the `loadall` function
						var x = jQuery(elm).find('.o_pager_value .o_input').get(0);
						var intval = parseInt(document.getElementsByClassName('o_pager_limit')[0].innerHTML);
						// Remove the first part of the pagination range
						var xx = x.value.split('-');
						var newint = parseInt(xx[1]);
						// Load the next 80 records, or however many is remaining
						newint = newint + 80;
						if (newint > intval) {
							newint = intval;
						}
						// Set the new pager value
						x.setAttribute('value','1-' + newint.toString());
						// This will automatically make the pager start loading in more records
						jQuery(elm).find('.o_pager_value .o_input').blur()
					},
					100 // After a 10th of a second has passed
				);
			}
			setTimeout(
				() => {
					// When done loading records, make this function available to be used again
					ees.scroll_load.loading = false;
				}, 500 // After half a second has passed
			);
		}
	},
};
