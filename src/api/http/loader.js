const Router = require('../../helpers/router');
const httpApi = require('../../helpers/httpApi');
/**
 * Binds api with modules and creates common url.
 * - End point: `/api/loader`
 * - Public API:
 *    - get    /status
 *    - get    /status/sync
 * - Private API:
 *    - get    /status/ping
 * @memberof module:loader
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} loaderModule - Module loader instance.
 * @param {scope} app - Network app.
 */
// Constructor
function LoaderHttpApi(loaderModule, app) {
    const router = new Router();

    router.map(loaderModule.shared, {
        'get /status': 'status',
        'get /status/sync': 'sync'
    });

    router.get('/status/ping', (req, res) => {
        const status = loaderModule.internal.statusPing();
        return res.status(status ? 200 : 503).json({ success: status });
    });

    httpApi.registerEndpoint('/api/loader', app, router, loaderModule.isLoaded);
}

module.exports = LoaderHttpApi;

/** ************************************* END OF FILE ************************************ */
