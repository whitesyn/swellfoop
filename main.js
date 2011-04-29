function Game(_canvasId, _infoCanvasId, _settings) {
    
    //console.profile();
    
    this._canvas        = null;
	this._infoCanvas	= null;
    this._ctx           = null;
    this._map           = [];
    this._area          = [];
    this._blocks        = [];
    this._blocksCount   = 0;
    this._activeColor   = -1;
	this._points		= 0;
	this._pointsHash	= {};
    this._gradientStart = [ "rgba(200,0,0, 0.7)", "rgba(0,200,0, 0.8)", "rgba(0,0,200, 0.8)" ];
    this._gradientStop 	= [ "rgba(255,0,0, 0.7)", "rgba(0,255,0, 0.8)", "rgba(0,0,255, 0.8)" ];
	
	this.isLocked = false;
	this.isEnded = false;
	this._isSubmitted = false;
	
    this._settings = {
        colorsCount : 3, 
        colsCount 	: 15,
        rowsCount 	: 10,
        blockSize 	: 40,
		useRating	: true
    };
    
    try {
        this._setSettings(_settings);
        this.init(_canvasId, _infoCanvasId);
    } catch (e) {
        alert(e.message);
    }
    //console.profileEnd();
}

/**
 *
 */
Game.prototype.init = function(_canvasId, _infoCanvasId) {
	if (!document.createElement('canvas').getContext) {
		throw new Error('Your browser does not support canvas.');
	}
    var canvasId = _canvasId.toString();
    if ( document.getElementById(canvasId) ) {
        this._canvas = document.getElementById(canvasId);
        this._canvas.width = this.getSetting('colsCount') * this.getSetting('blockSize');
        this._canvas.height = this.getSetting('rowsCount') * this.getSetting('blockSize');
    } else {
        throw new Error('Element <canvas> with ID=' + canvasId + ' does not exist!');
    }
	
	var infoCanvasId = _infoCanvasId.toString();
	if ( document.getElementById(infoCanvasId) ) {
        this._infoCanvas = document.getElementById(infoCanvasId);
        this._infoCanvas.width = this.getSetting('colsCount') * this.getSetting('blockSize') - 2;
        this._infoCanvas.height = 30;
    } else {
        throw new Error('Element <canvas> with ID=' + infoCanvasId + ' does not exist!');
    }
    this._ctx = this._canvas.getContext('2d');
    this._initEvents();
	this._initBlocks();
    this._initMap();
    this._drawMap();
	this._clearInfo();
}

/**
 *
 */
Game.prototype._setSettings = function(_settings) {
    if (typeof _settings == 'object') {
        for (var key in _settings) {
            this._setSetting(key, _settings[key])
        }
    }
}

/**
 *
 */
Game.prototype._setSetting = function(_key, _value) {
    if (this._settings.hasOwnProperty(_key)) {
        this._settings[_key] = _value;
    } else {
        throw new Error('Object "Game" does not have setting "' + _key + '"');
    }
}

/**
 *
 */
Game.prototype.getSetting = function(key) {
    return this._settings[key];
}

/**
 * Initialize canvas events handlers
 */
Game.prototype._initEvents = function() {
    var self = this;
    addEvent ( this._canvas, 'mousemove', function(e) {
        if (self.isLocked) return false;
        var mouseX = e.clientX - this.offsetLeft,
            mouseY = e.clientY - this.offsetTop;
        var coords = self._getBlockByXY(mouseX, mouseY);
        if (self._activeColor = self._map[coords[0]][coords[1]] != -1)  {
            if (!self._area[coords[0]] || self._area[coords[0]][coords[1]] == -1) {
				self._activeColor = self._map[coords[0]][coords[1]]
				self._clearArea();
				self._setStartPoint(coords[0], coords[1]);
				if (self._buildArea(coords[0], coords[1], 1)) {
					self._drawArea();
					self._drawInfo();
				}
			}
        } else if (self._activeColor != -1){
			self._activeColor = -1;
			self._clearArea();
		}
    });
	
    addEvent ( this._canvas, 'click', function(e) {
        if (!self.isLocked) {
			self._destroyArea();
			self._drawInfo();
			if (!self._checkMapForArea()) {
				self._complete();
			}
		}
		return false;
    });
	
    addEvent ( this._canvas, 'mouseout', function(e) {
        if (!self.isLocked) {
			self._drawMap();
		}
		return false;
    });
}

/**
 *
 */
Game.prototype._initMap = function() {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        colorsCount = this.getSetting('colorsCount');	
	this._map = [];
    for (var i=0; i<colsCount; ++i) {
        this._map.push([]);
        for (var j=0; j<rowsCount; ++j) {
            var color = randomNumber(0, colorsCount-1);
            if ( this._blocks[color] == 0 &&
				((color = this._getBlockColor()) == -1)) {
				break;
			}
            this._map[i].push(color);
            this._blocks[color]--;
        }
    }
	var transposedMap = this._getTransposedMap();
    this._map = [];
    for (var i=0; i<colsCount; ++i) {
        this._map.push([]);
        for (var j=0; j<rowsCount; ++j) {
            this._map[i].push(transposedMap[j][i]);
        }
    }
}

/**
 *
 */
Game.prototype._initBlocks = function() {
	var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
		colorsCount = this.getSetting('colorsCount');
	this._blocksCount = rowsCount * colsCount;
	var blocksPerColor = this._blocksCount / colorsCount;
	for (var i=0; i<colorsCount; ++i) {
        this._blocks.push(blocksPerColor);
    }
}

/**
 *
 */
Game.prototype._getBlockColor = function() {
	var color = -1;
	var length = this._blocks.length;
	for (var i=0; i<length; ++i) {
		if (this._blocks[i] != 0) {
			color = i;
			break;
		}
	}
	return color;
}

/**
 *
 */
Game.prototype._getTransposedMap  = function() {
	var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount');
	var map = [];
	for (var i=0; i<rowsCount; ++i) {
        map.push([]);
        for (var j=0; j<colsCount; ++j) {
            map[i].push(this._map[j][i]);
        }
        var x = randomNumber(1, rowsCount);
        for (var j=0; j<x; ++j) {
             map[i].push(map[i].shift());
        }
    }
	return map;
}

/**
 *
 */
Game.prototype._rebuildMap = function(from, to) {
    this.isLocked = true;
    this._rebuildColumns(from, to);
	this._shiftColumns(from);
    this.isLocked = false;
}

/**
 *
 */
 Game.prototype._rebuildColumns = function(_from, _to) {
	var rowsCount = this.getSetting('rowsCount');
	for (var i=_from; i<=_to; ++i) {
        for (var j=rowsCount-1; j>=0; --j) {
            if (this._map[i][j] == -1) {
                // search block above
                var x = j;
                for (var k=x-1; k>=0; --k) {
                    if (this._map[i][k] != -1) {
                        this._map[i][x] = this._map[i][k];
                        this._map[i][k] = -1;
                        x = k;
                    }
                }
            }
        }
    }
 }

 /**
  *
  */
Game.prototype._shiftColumns = function(_from) {
	var colsCount = this.getSetting('colsCount');
    for (var i=_from; i<colsCount; ++i) {
        if ( this._isEmptyColumn(i) ) {
            // get first non-empty column index
            for (var j=i+1; j<colsCount; ++j) {
                if ( !this._isEmptyColumn(j) ) {
					this._copyColumn(i, j);
					this._resetColumn(j);
                    break;
                }
            }
        }
    }
}
 
/**
 *
 */
Game.prototype._resetColumn = function(col) {
    var rowsCount = this.getSetting('rowsCount');
    this._map[col] = [];
    for (var i=0; i<rowsCount; ++i) {
        this._map[col].push(-1);
    }
}

/**
 *
 */
Game.prototype._copyColumn = function(col1, col2) {
    var rowsCount = this.getSetting('rowsCount');
    for (var i=0; i<rowsCount; ++i) {
        this._map[col1][i] = this._map[col2][i];
    }
}

/**
 *
 */
Game.prototype._isEmptyColumn = function(col) {
    var rowsCount = this.getSetting('rowsCount');
    return ( this._map[col][rowsCount-1] == -1 );
}

/**
 *
 */
Game.prototype._drawMap = function() {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        blockSize = this.getSetting('blockSize');
    
    this._canvas.width = this._canvas.width;
    this._ctx.strokeStyle = 'rgb(0,0,0)';
    this._ctx.lineWidth   = 1;
    for (var i=0; i<colsCount; ++i) {
        for (var j=0; j<rowsCount; ++j) {
            var x = i*blockSize;
            var y = j*blockSize;
            if (this._map[i][j] != -1) {
                var fillStyle = this._ctx.createRadialGradient(
                    x+blockSize/2, y+blockSize/2, 0, 
                    x+blockSize, y+blockSize, blockSize);
                fillStyle.addColorStop(0, this._gradientStart[this._map[i][j]]);
                fillStyle.addColorStop(1, this._gradientStop[this._map[i][j]]);
            } else {
                var fillStyle = "rgb(60,60,60)";
            }
            this._drawBlock(x, y, blockSize, blockSize, fillStyle);
        }
    }
}

/**
 *
 */
Game.prototype._drawBlock = function(x, y, width, height, fillStyle) {
    this._ctx.fillStyle = fillStyle;
    this._ctx.beginPath();
    this._ctx.moveTo(x, y);
    this._ctx.lineTo(x+width, y);
    this._ctx.lineTo(x+width, y+height);
    this._ctx.lineTo(x, y+height);
    this._ctx.lineTo(x, y);
    this._ctx.fill();
    this._ctx.stroke();
    this._ctx.closePath();
}

/**
 *
 */
Game.prototype._buildArea = function(col, row, step) {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        point = this._map[col][row];
    if (point == -1) {
		return false;
	}
    if (row-1>=0 && this._map[col][row-1] == point && this._area[col][row-1] == -1) {
		this._area[col][row-1] = step;
		this._buildArea(col, row-1, step+1);
    }
    if (row+1<rowsCount && this._map[col][row+1] == point && this._area[col][row+1] == -1) {
		this._area[col][row+1] = step;
		this._buildArea(col, row+1, step+1);
    }
    if (col-1>=0 && this._map[col-1][row] == point && this._area[col-1][row] == -1) {
		this._area[col-1][row] = step;
		this._buildArea(col-1, row, step+1);
    }
    if (col+1<colsCount && this._map[col+1][row] == point && this._area[col+1][row] == -1) {
		this._area[col+1][row] = step;
        this._buildArea(col+1, row, step+1);
    }
    return true;
}

/**
 *
 */
Game.prototype._destroyArea = function() {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        count = this._getAreaBlocksCount();
    var changedCols = [];
    if (count < 2) {
        return false;
    } else {
        this._blocksCount -= count;
        for (var i=0; i<colsCount; ++i) {
            for (var j=0; j<rowsCount; ++j) {
                if (this._area[i][j]!=-1) {
                    this._map[i][j] = -1;
                    this._area[i][j]= -1;
                    changedCols[i] = true;
                }
            }
        }
        var length = changedCols.length;
		var to = length-1;
		var from = 0;
		for (var i=0; i<length; ++i) {
			if (changedCols[i]) {
				from = i;
				break;
			}
		}
		this._rebuildMap(from, to);
		this._drawMap();
		this._addPoints(count);
    }
}

/**
 *
 */
Game.prototype._clearArea = function() {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        blockSize = this.getSetting('blockSize');
    if (!this._area.length) {
        return false;
    }
    this._ctx.strokeStyle = 'rgb(0,0,0)';
    this._ctx.lineWidth   = 1;
    for (var i=0; i<colsCount; ++i) {
        for (var j=0; j<rowsCount; ++j) {
            var x = i*blockSize;
            var y = j*blockSize;
            if (this._area[i][j] != -1) {
                var fillStyle = "rgb(255,255,255)";
                this._drawBlock(x, y, blockSize, blockSize, fillStyle);
                fillStyle = this._ctx.createRadialGradient(
                    x+blockSize/2, y+blockSize/2, 0, 
                    x+blockSize, y+blockSize, blockSize);
                fillStyle.addColorStop(0, this._gradientStart[this._map[i][j]]);
                fillStyle.addColorStop(1, this._gradientStop[this._map[i][j]]);
                this._drawBlock(x, y, blockSize, blockSize, fillStyle);
            }
        }
    }
	this._area = [];
}

/**
 *
 */
Game.prototype._setStartPoint = function(col, row) {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount');
    this._area = [];
    for (var i=0; i<colsCount; ++i) {
        this._area.push([]);
        for (var j=0; j<rowsCount; ++j) {
            this._area[i].push(-1);
        }
    }
    this._area[col][row] = 0;
}

/**
 *
 */
Game.prototype._checkMapForArea = function() {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount');
    for (var i=0; i<colsCount; ++i) {
        for (var j=0; j<rowsCount; ++j) {
            if (this._isPointInArea(i, j)) {
                return true;
            }
        }
    }
    return false;
}

/**
 *
 */
Game.prototype._isPointInArea = function(col, row) {
    var rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        point = this._map[col][row];

	return ( (point != -1) && 
		( (col-1>=0 && this._map[col-1][row] == point )
			|| (col+1<colsCount && this._map[col+1][row] == point)
			|| (row-1>=0 && this._map[col][row-1] == point) 
			|| (row+1<rowsCount && this._map[col][row+1] == point) ) )
}

/**
 *
 */
Game.prototype._drawArea = function() {
    var x, y,
        rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount'),
        blockSize = this.getSetting('blockSize');
    for (var i=0; i<colsCount; ++i) {
        for (var j=0; j<rowsCount; ++j) {
            if (this._area[i][j]!=-1) {
                x = i*blockSize;
                y = j*blockSize;
                this._drawBlock(x, y, blockSize, blockSize, 'rgba(255,255,255, 0.5)');
            }
        }
    }
} 

/**
 *
 */
Game.prototype._getAreaBlocksCount = function() {
    var count = 0,
        rowsCount = this.getSetting('rowsCount'),
        colsCount = this.getSetting('colsCount');
    for (var i=0; i<colsCount; ++i) {
        for (var j=0; j<rowsCount; ++j) {
            if (this._area[i][j]!=-1) {
                ++count;
            }
        }
    }
    return count;
}

/**
 *
 */
Game.prototype._getBlockByXY = function(x, y) {
    var row = parseInt(y / this.getSetting('blockSize')),
        col = parseInt(x / this.getSetting('blockSize'));
    return [col, row];
}

/**
 *
 */
Game.prototype._addPoints = function(_count) {
	if (!this._pointsHash[_count]) {
		this._pointsHash[_count] = this._calculatePoints(_count);
	}
	this._points += this._pointsHash[_count];
}

/**
 *
 */
Game.prototype._calculatePoints = function(_count) {
	return ( _count > 1 ) ? (_count-2) * (_count-2) : 0;
}

/**
 *
 */
Game.prototype._drawInfo = function() {
	this._infoCanvas.width = this._infoCanvas.width;
	var areaPoints = this._calculatePoints(this._getAreaBlocksCount());
	var ctx = this._infoCanvas.getContext('2d');
	ctx.fillStyle    = '#00f';
	ctx.font         = '24px Arial';
	ctx.textBaseline = 'top';
	ctx.fillText(areaPoints, 10, 3);
	ctx.fillText('Total points: ' + this._points, this._infoCanvas.width-200, 3);
}

/**
 *
 */
Game.prototype._clearInfo = function() {
	var ctx = this._infoCanvas.getContext('2d');
	ctx.fillStyle    = '#00f';
	ctx.font         = '24px Arial';
	ctx.textBaseline = 'top';
	ctx.fillText(0, 10, 3);
	ctx.fillText('Total points: ' + this._points, this._infoCanvas.width-200, 3);
}

/**
 *
 */
Game.prototype._complete = function() {
	this.isLocked = true;
	this.isEnded = true;
	if (this._blocksCount == 0) {
		this._points += 1000;
		this._drawInfo();
	}
	if (this.getSetting('useRating')) {
		this.showRating();
	} else {
		var message = (this._blocksCount == 0) ? "You win!\n" : "Game Over\n";
		alert(message + this._points);
	}
}

/**
 *
 */
Game.prototype.showRating = function() {
	var self = this;
	var url = 'rating.php?action=getTop';
	var oXHR = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
	oXHR.open('GET', url, true);
	oXHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	oXHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	oXHR.send(null);
	oXHR.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 || this.status == 304) {
				var json = eval('(' + this.responseText + ')');
				self._populateRatings(json);
				var nickname = self._getNickname();
				document.getElementById('nickname').value = nickname;
				var oDialog = document.getElementById('dialog');
				document.getElementById('submit').disabled = false;
				oDialog.style.display = 'block';
			} else {
				alert('Can\t load rating.')
			}
		}
	}
}

Game.prototype._populateRatings = function(json) {
	var ratingList = document.querySelector('#dialog > div.body > ul.rating');
	var list = [];
	for (var i in json) {
		if (json.hasOwnProperty(i)) {
			list.push('<li><span class="nickname">' + json[i].nickname + 
				'</span><span class="points">' + json[i].points + 
				'</span></li>'); 
		}
	}
	ratingList.innerHTML = list.join("");
}

Game.prototype.submitRating = function() {
	var self = this;
	if (!self.isEnded) {
		alert('Complete game, please.');
		return false;
	}
	var nickname = document.getElementById('nickname').value;
	if (!nickname) {
		alert('Enter your nickname, please.');
		return false;
	}
	if (self._isSubmitted) {
		alert('You already submit your result.');
		return false;
	}
	document.getElementById('submit').disabled = true;
	document.cookie = 'nickname=' + nickname;
	var url = 'rating.php?action=add&nickname=' + encodeURIComponent(nickname) +
		'&points=' + this._points;
	var oXHR = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
	oXHR.open('GET', url, true);
	oXHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	oXHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	oXHR.send(null);
	oXHR.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 || this.status == 304) {
				var json = eval('(' + this.responseText + ')');
				self._isSubmitted = true;
				alert(json.message);
			} else {
				alert('Can\t load rating.')
			}
		}
	}
}

/**
 *
 */
Game.prototype._getNickname = function() {
	var cookie = ' ' + document.cookie;
	var search = ' nickname=';
	var nickname = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1) {
				end = cookie.length;
			}
			nickname = cookie.substring(offset, end);
		}
	}
	return (nickname);
}


function randomNumber(m, n) {
  return Math.floor( Math.random() * (n - m + 1) ) + m;
}

var addEvent = (function (_element, _event, _handler) {
	if (document.addEventListener) {
		return function (_element, _event, _handler) {
			_element.addEventListener(_event, _handler, false);
		}
	} else if (document.attachEvent) {
		return function (_element, _event, _handler) {
			_element.attachEvent('on'+_event, _handler);
		}
	} else {
		throw new Error('Can\'t add event ' + _event + ' to ' + _element);
	}
})();

addEvent(window, 'load', function(){
	addEvent(document.getElementById('newGame'), 'click', function() {
		document.location.reload();
	});
	
	addEvent(document.getElementById('submit'), 'click', function() {
		game.submitRating();
	});
	
	var game = new Game("game", "info");
})
