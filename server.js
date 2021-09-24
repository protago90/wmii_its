// moduły wbudowane
const http = require('http')
const fs = require('fs')
const url = require('url')

// moduły dodatkowe
const nodestatic = require('node-static')
const cookies = require('cookies')
const uuid = require('uuid')

// moduły własne
const common = require('./common')
const db = require('./db')
const dbrest = require('./dbrest')
const auth = require('./auth')

// inicjalizacja globalnych obiektów
common.config = JSON.parse(fs.readFileSync('config.json'))
console.log('Konfiguracja serwera:', common.config)
const httpServer = http.createServer()
const fileServer = new nodestatic.Server(common.config.frontend_dir, { cache: common.config.cache })

// zdefiniowanie reakcji na request http
httpServer.on('request', function(req, res) {

    // kontrola sesji
    let appCookies = new cookies(req, res)
    let session = appCookies.get('session')
    let now = Date.now()
    if(!session || !common.sessions[session]) {
        session = uuid.v4()
        common.sessions[session] = { from: req.connection.remoteAddress, created: now, touched: now }
        appCookies.set('session', session, { httpOnly: false })    
    } else {
        common.sessions[session].from = req.connection.remoteAddress
        common.sessions[session].touched = now
    }

    // środowisko żądania
    let env = {
        req: req,
        res: res,
        session: session
    }

    // parsowanie url
    env.parsedUrl = url.parse(req.url, true)

    // wczytywanie payloadu
    let payload = ''
    req .on('data', function(data) {
            payload += data
        })
        .on('end', function() {
            // żądanie na konsolę
            console.log(session, req.method, req.url, payload)

            env.parsedPayload = null
            if(payload) {
                try {
                    // parsowanie payloadu
                    env.parsedPayload = JSON.parse(payload)
                } catch(ex) {
                    common.serveError(res, 400, ex.message)
                    return
                }
            }

            // właściwa obsługa żądania
            switch(env.parsedUrl.pathname) {

                // autentykacja
                case '/auth':
                    if(auth[env.req.method]) {
                        auth[env.req.method](env)
                    } else {
                        common.serveError(res, 405, 'Method not allowed')
                    }
                    return

                // pozostałe endpointy restowe
                case '/person':
                    // zabronienie dostępu do danych niewłaściwym użytkownikom
                    if(common.sessions[env.session].role != 2) {
                        common.serveError(res, 403, 'Forbidden')
                        return
                    }

                    let order = null
                    let params = { searchFields: [ 'name' ] }
                    if(env.parsedUrl.query.order) {
                        switch(env.parsedUrl.query.order) {
                            case 'NA': order = { name: 1 }
                                break
                            case 'ND': order = { name: -1 }
                                break
                            case 'VA': order = { value: 1 }
                                break
                            case 'VD': order = { value: -1 }
                                break
                        }
                    }
                    if(order) params.order = order
                    dbrest.handle(env, db.persons, params)
                    return

                case '/project':
                    dbrest.handle(env, db.projects, { searchFields: [ 'project', 'name' ], order: { name: 1 } })
                    return

                case '/task':
                    dbrest.handle(env, db.tasks, { searchFields: [ 'project', 'name' ], order: { name: 1 } })
                    return

                // serwowanie statycznej treści
                default:
                    if(req.method == 'GET')
                        fileServer.serve(req, res)
                    else
                        common.serveError(res, 400, 'Bad request')
            }
    })
})

try {

    // inicjalizacja bazy danych
    db.init(common.config.dbUrl, common.config.dbName, function() {

        // uruchomienie serwera http
            httpServer.listen(common.config.port)
            console.log('Serwer nasłuchuje na porcie', common.config.port)
    })
} catch(ex) {
    console.error('Błąd inicjalizacji:', ex.message)
    process.exit(0)
}