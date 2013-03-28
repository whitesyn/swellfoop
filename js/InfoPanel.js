SwellFoop.InfoPanel = (function ($, doc) {

	/**
	 * Information panel
	 *
	 * @constructor
	 */
    var InfoPanel = function () {
        var that        = this,
            container   = doc.createElement('div'),
            scoresEl    = doc.createElement('div'),
            resultEl    = doc.createElement('div');

        container.classList.add('info-panel');
        scoresEl.classList.add('scores');
        resultEl.classList.add('result');

        container.appendChild(scoresEl);
        container.appendChild(resultEl);

        that.el         = container;
        that.scoresEl   = scoresEl;
        that.resultEl   = resultEl;

	    that.setScores(0);
	    that.setResult(0);
    };

    InfoPanel.prototype = {

	    /**
	     * Set current scores text
	     *
	     * @param {Number}  scores  Scores
	     */
        setScores: function (scores) {
            this.scoresEl.innerText = 'Score: ' + scores;
        },

	    /**
	     * Set total scores text
	     *
	     * @param {Number}  result  Total scores
	     */
        setResult: function (result) {
            this.resultEl.innerText = 'Total: ' + result;
        }
    };

    return InfoPanel;

}(UTILS || {}, window.document));