/**
 * Validates sort options, methods and fields.
 * @memberof module:helpers
 * @function
 * @param {array} orderBy
 * @param {string} options
 * @return {Object} error | {sortField, sortMethod}.
 */
function OrderBy(orderBy, options) {
    options = (typeof options === 'object') ? options : {};
    options.sortField = options.sortField || null;
    options.sortMethod = options.sortMethod || null;
    options.sortFields = Array.isArray(options.sortFields) ? options.sortFields : [];

    if (typeof options.quoteField === 'undefined') {
        options.quoteField = true;
    } else {
        options.quoteField = Boolean(options.quoteField);
    }

    let sortField,
        sortMethod;

    if (orderBy) {
        const sort = String(orderBy).split(':');
        sortField = sort[0].replace(/[^\w\s]/gi, '');

        if (sort.length === 2) {
            sortMethod = sort[1] === 'desc' ? 'DESC' : 'ASC';
        }
    }

    function prefixField(sortField) {
        if (!sortField) {
            return sortField;
        } else if (typeof options.fieldPrefix === 'string') {
            return options.fieldPrefix + sortField;
        } else if (typeof options.fieldPrefix === 'function') {
            return options.fieldPrefix(sortField);
        }
        return sortField;
    }

    function quoteField(sortField) {
        if (sortField && options.quoteField) {
            return (`"${sortField}"`);
        }
        return sortField;
    }

    const emptyWhiteList = options.sortFields.length === 0;

    const inWhiteList = options.sortFields.length >= 1 && options.sortFields.indexOf(sortField) > -1;

    if (sortField) {
        if (emptyWhiteList || inWhiteList) {
            sortField = prefixField(sortField);
        } else {
            return {
                error: 'Invalid sort field'
            };
        }
    } else {
        sortField = prefixField(options.sortField);
    }

    if (!sortMethod) {
        sortMethod = options.sortMethod;
    }

    return {
        sortField: quoteField(sortField),
        sortMethod
    };
}

module.exports = OrderBy;

/** ************************************* END OF FILE ************************************ */
