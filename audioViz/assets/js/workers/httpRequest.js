//http://stackoverflow.com/questions/26668430/is-it-possible-to-run-angular-in-a-web-worker
self.window = self;

self.history = {};
self.document = {
    readyState: 'complete',
    querySelector: function () {},
    createElement: function () {
        return {
            pathname: '',
            setAttribute: function () {}
        }
    }
};



onmessage = function(e) {
    postMessage({});
};