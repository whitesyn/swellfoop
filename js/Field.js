SwellFoop.Field = (function ($, doc, undef) {

    /**
     * Game field constructor
     *
     * @param {Object}  settings
     * @constructor
     */
    var Field = function (settings) {
        var that = this,
            blockSize = settings.blockSize,
            field = doc.createElement('canvas');

        that.settings = settings;
        field.width = settings.colsCount * blockSize;
        field.height = settings.rowsCount * blockSize;

        field.classList.add('game-field');

        that.el = field;
        that.ctx = field.getContext('2d');
        that.isLocked = false;
        that._points = 0;

        that._pointsCache = {};

        that._initEvents();
        that._initMap();

        that._drawMap();
    };

    Field.prototype = {

        /**
         * Initialization of the mouse events for the field
         *
         * @private
         */
        _initEvents: function () {
            var that = this;

            $.addEvent(that.el, 'mousemove', function (e) {
                var el = this,
                    map = that._map,
                    area = that._area,
                    currentColor,
                    index;

                if (that.isLocked) {
                    return false;
                }

                index = that._getBlockIndexByXY(e.clientX - el.offsetLeft, e.clientY - el.offsetTop);

                currentColor = map[index];

                if (that._activeColor !== currentColor) {
                    // if mouse moved to the empty space
                    if (currentColor === -1) {
                        that._clearArea();
                    } else if (area[index] !== currentColor) {
                        that._clearArea();
                        if (that._buildArea(index)) {
                            that._drawArea();
                        }
                    }
                }

                that._activeColor = currentColor;
            });

            $.addEvent(that.el, 'mouseout', function (e) {
                if (that.isLocked) {
                    return false;
                }

                that._clearArea();
            });

            $.addEvent(that.el, 'click', function (e) {
                if (that.isLocked) {
                    return false;
                }

                that._destroyArea();
                if (!that._checkMapForArea()) {
                    that._complete();
                }
            });
        },

        /**
         * Initialization of the array for the game field
         *
         * @private
         */
        _initMap: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                colorsCount = settings.colors.length,
                blocksCount = rowsCount * colsCount,
                blocksPerColor = blocksCount / colorsCount,
                map = new Int8Array(blocksCount),
                blocks = [],
                i = 0,
                j;

            for (i; i < colorsCount; ++i) {
                for (j = 0; j < blocksPerColor; ++j) {
                    blocks.push({
                        color: i,
                        order: Math.random()
                    });
                }
            }

            blocks.sort(function (a, b) {
                return a.order - b.order;
            });

            for (i = 0; i < blocksCount; ++i) {
                map[i] = blocks[i].color;
            }

            that._blocksCount = blocksCount;
            that._map = map;
            that._area = new Int8Array(blocksCount);
            that._selectedCount = 0;
        },

        /**
         * Rebuild map's data
         *
         * @param {Number} from Column index from which rebuild starts
         * @param {Number} to   Column index on which rebuild ends
         *
         * @private
         */
        _rebuildMap: function (from, to) {
            var that = this;

            that.isLocked = true;
            that._rebuildColumns(from, to);
            that._shiftColumns(from);
            that.isLocked = false;
        },

        /**
         * Rebuild map's columns from index "from" to index with "to"
         *
         * @param {Number} from Column index from which rebuild starts
         * @param {Number} to   Column index on which rebuild ends
         *
         * @private
         */
        _rebuildColumns: function (from, to) {
            var that = this,
                map = that._map,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                indexFrom,
                i, j;


            for (; from <= to; ++from) {
                indexFrom = (rowsCount - 1) * colsCount + from;
                for (; indexFrom >= 0; indexFrom -= colsCount) {
                    if (map[indexFrom] === -1) {
                        i = indexFrom;
                        for (j = i - colsCount; j >= 0; j -= colsCount) {
                            if (map[j] !== -1) {
                                map[i] = map[j];
                                map[j] = -1;
                                i = j;
                            }
                        }
                        if (that._isEmptyColumn(from)) {
                            break;
                        }
                    }
                }
            }
        },

        /**
         * Move columns at the right to the empty columns place
         *
         * @param {Number} from Column index from which start
         *
         * @private
         */
        _shiftColumns: function (from) {
            var that = this,
                settings = that.settings,
                colsCount = settings.colsCount,
                i;

            for (; from < colsCount; ++from) {
                if (that._isEmptyColumn(from)) {
                    // get first non-empty column index
                    for (i = from + 1; i < colsCount; ++i) {
                        if (!that._isEmptyColumn(i)) {
                            that._moveColumn(from, i);
                            break;
                        }
                    }
                }
            }
        },

        /**
         * Checks is column empty or not
         *
         * @param   {Number}    columnIdx   Column index
         *
         * @return  {Boolean}
         *
         * @private
         */
        _isEmptyColumn: function (columnIdx) {
            var that = this,
                settings = that.settings;

            return that._map[(settings.rowsCount - 1) * settings.colsCount + columnIdx] === -1;
        },

        /**
         * Move columns
         *
         * @param {Number}  to      "Move to" column index
         * @param {Number}  from    "Move from" columns index
         *
         * @private
         */
        _moveColumn: function (to, from) {
            var that = this,
                map = that._map,
                length = map.length,
                settings = that.settings,
                colsCount = settings.colsCount;

            for (; to < length; to += colsCount, from += colsCount) {
                map[to] = map[from];
                map[from] = -1;
            }

            that._map = map;
        },

        /**
         * Draws map of the colors on canvas element
         *
         * @private
         */
        _drawMap: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                blockSize = settings.blockSize,
                colors = settings.colors,
                defaultColor = settings.defaultColor,
                el = that.el,
                ctx = that.ctx,
                map = that._map,
                i, j, index, x, y, fillStyle;

            el.width = el.width;
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 1;

            for (i = 0; i < rowsCount; ++i) {
                index = i * colsCount;
                y = i * blockSize;

                for (j = 0; j < colsCount; ++j) {
                    x = j * blockSize;

                    fillStyle = (map[index] == -1)
                        ? defaultColor
                        : colors[map[index]];

                    that._drawBlock(x, y, blockSize, blockSize, fillStyle);
                    ++index;
                }
            }
        },

        /**
         * Draw one color block on canvas
         *
         * @param {Number}  x           X-coordinate
         * @param {Number}  y           Y-coordinate
         * @param {Number}  width       Width of the block
         * @param {Number}  height      Height of the block
         * @param {String}  fillStyle   Fill style of the block
         *
         * @private
         */
        _drawBlock: function (x, y, width, height, fillStyle) {
            var ctx = this.ctx;

            ctx.fillStyle = fillStyle;

            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        },

        /**
         * Gets block index in map array by mouse position
         *
         * @param {Number}  x   x-coordinate
         * @param {Number}  y   y-coordinate
         *
         * @return {Number}
         *
         * @private
         */
        _getBlockIndexByXY: function (x, y) {
            var settings = this.settings,
                blockSize = settings.blockSize;

            return ((x / blockSize) << 0) + settings.colsCount * ((y / blockSize) << 0);
        },

        /**
         * Clears selected area
         *
         * @private
         */
        _clearArea: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                blockSize = settings.blockSize,
                colors = settings.colors,
                defaultColor = settings.defaultColor,
                map = that._map,
                area = that._area,
                empty = new Int8Array(rowsCount * colsCount),
                i, j, index, x, y, fillStyle;

            for (i = 0; i < rowsCount; ++i) {
                index = i * colsCount;
                y = i * blockSize;

                for (j = 0; j < colsCount; ++j) {

                    if (area[index] !== -1) {
                        x = j * blockSize;
                        fillStyle = (map[index] == -1)
                            ? defaultColor
                            : colors[map[index]];

                        that._drawBlock(x, y, blockSize, blockSize, fillStyle);
                    }

                    empty[index] = -1;
                    ++index;
                }
            }

            that._area = empty;
            that._selectedCount = 0;

            if ($.isFunction(that.settings.onSelected)) {
                that.settings.onSelected(0);
            }
        },

        /**
         * Builds area which could be selected
         *
         * @param   {Number}  index   Block index
         *
         * @return  {Boolean}
         *
         * @private
         */
        _buildArea: function (index) {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                blockCount = rowsCount * colsCount,
                map = that._map,
                area = that._area,
                point = map[index],

                isTopRow = (index < colsCount),
                isBottomRow = (index > blockCount - colsCount),
                isFirstColumn = (index % colsCount === 0),
                isLastColumn = (index % colsCount === colsCount - 1),

                topPoint = isTopRow ? -1 : map[index - colsCount],
                bottomPoint = isBottomRow ? -1 : map[index + colsCount],
                leftPoint = isFirstColumn ? -1 : map[index - 1],
                rightPoint = isLastColumn ? -1 : map[index + 1];

            if (point === -1) {
                return false;
            }

            area[index] = point;
            ++that._selectedCount;

            if (topPoint === point && area[index - colsCount] === -1) {
                that._buildArea(index - colsCount);
            }

            if (bottomPoint === point && area[index + colsCount] === -1) {
                that._buildArea(index + colsCount);
            }

            if (leftPoint === point && area[index - 1] === -1) {
                that._buildArea(index - 1);
            }

            if (rightPoint === point && area[index + 1] === -1) {
                that._buildArea(index + 1);
            }

            return true;
        },

        /**
         * Draws selected area
         *
         * @private
         */
        _drawArea: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                blockSize = settings.blockSize,
                area = that._area,
                i = 0,
                index, j, x, y;

            for (; i < rowsCount; ++i) {
                index = i * colsCount;
                y = i * blockSize;

                for (j = 0; j < colsCount; ++j) {
                    if (area[index] >= 0) {
                        x = j * blockSize;
                        that._drawBlock(x, y, blockSize, blockSize, 'rgba(255,255,255, 0.5)');
                    }
                    ++index;
                }
            }

            if ($.isFunction(that.settings.onSelected)) {
                that.settings.onSelected(that._calculatePoints(that._selectedCount));
            }
        },

        /**
         * Destroys selected area
         *
         * @return  {Boolean}
         *
         * @private
         */
        _destroyArea: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                map = that._map,
                area = that._area,
                selectedCount = that._selectedCount,
                changedCols = new Int8Array(colsCount),
                i = 0,
                j, index;

            if (selectedCount < 2) {
                return false;
            }

            that._blocksCount -= selectedCount;

            for (; i < rowsCount; ++i) {
                index = i * colsCount;

                for (j = 0; j < colsCount; ++j) {
                    if (area[index] !== -1) {
                        map[index] = -1;
                        changedCols[j] = 1;
                    }
                    area[index] = -1;
                    ++index;
                }
            }

            that._rebuildMap(
                Array.prototype.indexOf.call(changedCols, 1),
                Array.prototype.lastIndexOf.call(changedCols, 1)
            );
            that._drawMap();

            that._addPoints(that._calculatePoints(selectedCount));
            that._selectedCount = 0;

            return true;
        },

        /**
         * Adds points by selected blocks count
         *
         * @param   {Number}    points  Points to add
         *
         * @private
         */
        _addPoints: function (points) {
            var that = this;

            that._points += points;
            if ($.isFunction(that.settings.onPointsAdded)) {
                that.settings.onPointsAdded(points, that._points);
            }
        },

        /**
         * Calculates point by selected blocks count
         *
         * @param   {Number}    selectedCount   Number of the selected blocks
         *
         * @return  {Number}
         *
         * @private
         */
        _calculatePoints: function (selectedCount) {
            var that = this;

            if (that._pointsCache[selectedCount] == undef) {
                that._pointsCache[selectedCount] = (selectedCount > 1) ? (selectedCount - 2) * (selectedCount - 2) : 0
            }

            return that._pointsCache[selectedCount];
        },

        /**
         * Check map on existence of the area that could be destroyed
         *
         * @return  {Boolean}
         *
         * @private
         */
        _checkMapForArea: function () {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                i = rowsCount - 1,
                j, index;

            for (; i >= 0; --i) {
                index = i * colsCount + colsCount - 1;

                for (j = colsCount; j > 0; --j) {
                    if (that._isBlockInArea(index)) {
                        return true;
                    }
                    --index;
                }
            }

            return false;
        },

        /**
         * Checks that block in the area to destroy
         *
         * @param   {Number}    index   Block index
         *
         * @returns {Boolean}
         *
         * @private
         */
        _isBlockInArea: function (index) {
            var that = this,
                settings = that.settings,
                rowsCount = settings.rowsCount,
                colsCount = settings.colsCount,
                blockCount = rowsCount * colsCount,
                map = that._map,
                point = map[index],

                isTopRow = (index < colsCount),
                isBottomRow = (index > blockCount - colsCount),
                isFirstColumn = (index % colsCount === 0),
                isLastColumn = (index % colsCount === colsCount - 1),

                topPoint = isTopRow ? -1 : map[index - colsCount],
                bottomPoint = isBottomRow ? -1 : map[index + colsCount],
                leftPoint = isFirstColumn ? -1 : map[index - 1],
                rightPoint = isLastColumn ? -1 : map[index + 1];

            return (point !== -1) && (topPoint === point || bottomPoint === point || leftPoint === point || rightPoint === point);
        },

        /**
         * Complete game
         *
         * @private
         */
        _complete: function () {
            var that = this,
                blocksCount = that._blocksCount;

            that.isLocked = true;

            if (blocksCount === 0) {
                that._addPoints(1000);
            }

            if ($.isFunction(that.settings.onCompleted)) {
                that.settings.onCompleted(that._points, blocksCount);
            }
        }
    };

    return Field;

}(UTILS || {}, window.document));