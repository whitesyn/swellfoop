var SwellFoop = (function ($, w, undef) {
	"use strict";

	var doc = w.document;

	/**
	 * Game constructor
	 *
	 * @param   {Node}      container   Container where game will be created
	 * @param   {Object}    settings    Settings object
	 *
	 * @constructor
	 */
	var SwellFoop = function (container, settings) {
		var that = this;

		if (!(that instanceof SwellFoop)) {
			return new SwellFoop(container, settings);
		}

		if (!doc.createElement('canvas').getContext) {
			throw new Error('Your browser does not support canvas');
		}

		if (!container) {
			throw new Error('Please specify container element for the game');
		}

		that.field          = null;
		that.infoPanel      = null;
		that.ratingPanel    = null;

		that.container  = container;
		that.settings   = $.merge(settings, that.defaultSettings);

		that.settings.onPointsAdded = function (points, total) {
			that._onPointsAdded(points, total);
		}

		that.settings.onSelected = function (points) {
			that._onSelected(points);
		}

		that.settings.onCompleted = function (points, blocksCount) {
			that._onCompleted(points, blocksCount);
		}

		that._init();
	};

	SwellFoop.prototype = {

		defaultSettings: {
			colors:         ['red', 'green', 'blue'],
			defaultColor:   'rgb(60,60,60)',
			colsCount:      15,
			rowsCount:      10,
			blockSize:      40
		},

		/**
		 * Initialization
		 *
		 * @private
		 */
		_init: function () {
			var that = this;

			that._clear();

			that._createField();
			that._createRatingPanel();
			that._createInfoPanel();
		},

		/**
		 * Remove all elements inside container
		 *
		 * @private
		 */
		_clear: function () {
			var container = this.container;

			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}
		},

		/**
		 * Create game field
		 *
		 * @private
		 */
		_createField: function () {
			var that = this;

			that.field = new SwellFoop.Field(that.settings);
			that.container.appendChild(that.field.el);
		},

		/**
		 * Create information panel
		 *
		 * @private
		 */
		_createInfoPanel: function () {
			var that = this;

			that.infoPanel = new SwellFoop.InfoPanel();
			that.container.appendChild(that.infoPanel.el);
		},

		/**
		 * Create rating panel
		 *
		 * @private
		 */
		_createRatingPanel: function () {
			var that = this;

			that.ratingPanel = new SwellFoop.RatingPanel();
			that.container.appendChild(that.ratingPanel.el);

			that.ratingPanel.setData(JSON.parse(w.localStorage.getItem('results') || '[]'));
		},

		/**
		 * On points added handler
		 *
		 * @param   {Number}    points  Added points
		 * @param   {Number}    total   Total Points
		 *
		 * @private
		 */
		_onPointsAdded: function (points, total) {
			this.infoPanel.setResult(total);
		},

		/**
		 * On area to destroy selected handler
		 *
		 * @param   {Number}    points  Points for the selected area to destroy
		 *
		 * @private
		 */
		_onSelected: function (points) {
			this.infoPanel.setScores(points);
		},

		/**
		 * On game completed event handler
		 *
		 * @param {Number}  points  Total points
		 * @param {Number}  blocks  Blocks count
		 *
		 * @private
		 */
		_onCompleted: function (points, blocks) {
			var message = ((blocks == 0) ? 'You win!' : 'Game Over') + "\n"+ 'Do you want add result (' + points + ') to the rating?',
				ls      = w.localStorage,
				results = JSON.parse(ls.getItem('results') || '[]'),
				name

			if (confirm(message)) {
				name = prompt('Enter your name:', ls.getItem('lastName') || '').trim().substr(0, 100);

				if (name) {
					results.push({name: name, points: points});
					results.sort(function (a, b) {
						return b.points - a.points;
					});
					results = results.slice(0, 10);
					ls.setItem('results', JSON.stringify(results));
					ls.setItem('lastName', name);

					this.ratingPanel.setData(results);
				}
			}
		}
	};

	return SwellFoop;

}(UTILS || {}, window));