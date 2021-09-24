let common = module.exports = {

    config: {},
    
    sessions: {},

    serveJson: function(res, code, obj) {
        res.writeHead(code, { contentType: 'application/json' })
        let output = JSON.stringify(obj)
        console.log(code, output)
        res.end(output)
    },
    
    serveError: function(res, code, text) {
        common.serveJson(res, code, { error: text })
    }
        
}