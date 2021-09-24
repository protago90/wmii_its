const common = require('./common')
const db = require('./db')

let isSessionValid = function(env) {
    if(!env.session || !common.sessions[env.session]) {
        common.serveError(env.res, 404, 'Session not found')
        return false
    }
    return true
}

let auth = module.exports = {

    // who am I
    GET: function(env) {
        if(!isSessionValid(env)) return
        if(common.sessions[env.session].login) {
            common.serveJson(env.res, 200, { login: common.sessions[env.session].login, role: common.sessions[env.session].role })
        } else {
            common.serveJson(env.res, 200, { login: null })
        }
    },

    // log in
    POST: function(env) {
        if(!isSessionValid(env)) return
        if(!env.parsedPayload || !env.parsedPayload.login || !env.parsedPayload.password) {
            common.serveError(env.res, 401, 'No credentials passed')
            return
        }
        db.auth.findOne({ login: env.parsedPayload.login, password: env.parsedPayload.password }, function(err, doc) {
            if(err || !doc) {
                common.serveError(env.res, 401, 'Login failed')
            } else {
                common.sessions[env.session].login = doc.login
                common.sessions[env.session].role = doc.role
                auth.GET(env)
            }
            return
        })
        return
    },

    // log out
    DELETE: function(env) {
        if(!isSessionValid(env)) return
        delete common.sessions[env.session].login
        delete common.sessions[env.session].role
        auth.GET(env)
        return
    }

}