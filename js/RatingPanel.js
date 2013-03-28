SwellFoop.RatingPanel = (function ($, doc) {

    /**
     * Rating panel
     *
     * @constructor
     */
    var RatingPanel = function () {
        var that = this,
            container = doc.createElement('div'),
            resultEl = doc.createElement('div'),
            headerEl = doc.createElement('h2'),
            listEl = doc.createElement('ol')

        headerEl.classList.add('title');
        headerEl.innerText = 'Rating';

        container.classList.add('rating-panel');
        resultEl.classList.add('rating-list')

        resultEl.appendChild(listEl);
        container.appendChild(headerEl);
        container.appendChild(resultEl);

        that.el = container;
        that.resultEl = resultEl;
    };

    RatingPanel.prototype = {

        /**
         * Set current scores text
         *
         * @param   {Array} data    Array with rating results
         */
        setData: function (data) {
            var that = this,
                container = that.resultEl,
                list = doc.createElement('ol'),
                i = 0,
                item,
                result;

            for (; result = data[i]; ++i) {
                if (result.name && result.points) {
                    item = doc.createElement('li');
                    item.innerText = result.name + ' - ' + result.points;
                    list.appendChild(item);
                }
            }

            container.replaceChild(list, container.firstElementChild);
        }
    };

    return RatingPanel;

}(UTILS || {}, window.document));