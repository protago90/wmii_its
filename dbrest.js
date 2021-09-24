let common = require('./common')
let db = require('./db')

let dbrest = module.exports = {
    
    getOneObject: function(collection, query, _id, nextTick) {
        let localQuery = []
        for(let i in query) localQuery.push(query[i])
        localQuery.unshift({ $match: { _id: _id } })
        collection.aggregate(localQuery, { collation: { "locale": common.config.collation, strength: 1 }}).next(nextTick)
    },

    getObjects: function(collection, facet, nextTick) {
        collection.aggregate(facet, { collation: { "locale": common.config.collation, strength: 1 }}).next(nextTick)
    },

    handle: function(env, collection, specificity = { 
            aggregation: [],                                                // agregacja, np. łączenie z innymi kolekcjami
            order: {},                                                      // porządek sortowania
            searchFields: [],                                               // pola przeszukiwane przez search
            inputTransformation: function(payload) { return payload },      // przekształcenie payloadu przed insert/update (synchroniczne)
            validateUpdate: function(payload, nextTick) { nextTick(true) }  // sprawdzenie czy insert/update jest możliwy (asynchroniczne) 
        }) {

        let _id = null
        if((env.req.method == 'GET' || env.req.method == 'DELETE') && env.parsedUrl.query._id) {
            try {
                _id = db.ObjectId(env.parsedUrl.query._id)
            } catch(ex) {
                common.serveError(env.res, 400, ex.message)
                return
            }
        }

        switch(env.req.method) {

            case 'GET':
                if(_id) {
                    // pobierz pojedynczy obiekt z bazy
                    dbrest.getOneObject(collection, specificity.aggregation, _id, function(err, doc) {
                        if(err)
                            common.serveError(env.res, 400, err.message)
                        else if(!doc)
                            common.serveError(env.res, 404, 'Object not found')
                        else
                            common.serveJson(env.res, 200, doc)
                    })
                } else {
                    // pobierz zbiór obiektów
                    let searchFilter = null
                    if(env.parsedUrl.query.search && specificity.searchFields && specificity.searchFields.length > 0) {
                        searchFilter = { $or: [] }
                        for(let i in specificity.searchFields) {
                            let cond = {}
                            cond[specificity.searchFields[i]] = { $regex: env.parsedUrl.query.search, $options: 'i' }
                            searchFilter.$or.push(cond)
                        }
                    }

                    let filtered = [], data = []
                    for(let i in specificity.aggregation) {
                        filtered.push(specificity.aggregation[i])
                        data.push(specificity.aggregation[i])       
                    }

                    if(searchFilter) {
                        filtered.push({ $match: searchFilter })
                        data.push({ $match: searchFilter })
                    }

                    filtered.push({ $count: 'count' })

                    // sort
                    if(specificity.order) {
                        data.push({ $sort: specificity.order })
                    }

                    // skip
                    let skip = parseInt(env.parsedUrl.query.skip)
                    if( !isNaN(skip) && skip > 0) {
                        data.push({ $skip: skip })
                    } 
                    // limit
                    let limit = parseInt(env.parsedUrl.query.limit)
                    if( !isNaN(limit) && limit > 0) {
                        data.push({ $limit: limit })
                    }

                    let facet = [ { $facet: {
                        total: [
                            { $count: 'count' }
                        ],
                        filtered: filtered,
                        records: data
                    }}]

                    dbrest.getObjects(collection, facet, function(err, doc) {
                        if(err) 
                            common.serveError(env.res, 400, err.message)
                        else if(!doc)
                            common.serveError(env.res, 404, 'No objects found')
                        else {
                            doc.total = (Array.isArray(doc.total) && doc.total.length > 0 && doc.total[0].count ) ? doc.total[0].count : 0
                            doc.filtered = (Array.isArray(doc.filtered) && doc.filtered.length > 0 && doc.filtered[0].count ) ? doc.filtered[0].count : 0
                            common.serveJson(env.res, 200, doc)
                        }
                    })                    
                }
                break

            case 'DELETE':
                // usuń pojedynczy obiekt w bazie/usuń wszystkie obiekty

                collection.deleteMany(_id ? { _id: _id } : {}, function(err, result) {
                    if(err) 
                        common.serveError(env.res, 400, err.message)
                    else
                        common.serveJson(env.res, 200, { deletedCount: result.deletedCount })
                })
                break

            case 'POST':
                // utwórz nowy obiekt w bazie
                
                if(env.parsedPayload._id) {
                    common.serveError(env.res, 400, 'No _id allowed')
                    return
                }
                if(specificity.inputTransformation) {
                    try {
                        specificity.inputTransformation(env.parsedPayload)
                    } catch(ex) { 
                        common.serveError(env.res, 400, ex.message)
                        return
                    }
                }
                let validateUpdate = specificity.validateUpdate
                if(!validateUpdate) validateUpdate = function(payload, nextTick) { nextTick(true) }
                validateUpdate(env.parsedPayload, function(ok) { 
                    if(!ok) {
                        common.serveError(env.res, 400, 'Validation failed, insertOne suppressed')
                        return
                    }
                    collection.insertOne(env.parsedPayload, function(err, result) {
                        if(err || !result.ops || !result.ops[0]) {
                            common.serveError(env.res, 400, err ? err.message : 'Error during insertOne')
                        } else {
                            dbrest.getOneObject(collection, specificity.aggregation, result.ops[0]._id, function(err, doc) {
                                if(err)
                                    common.serveError(env.res, 400, err.message)
                                else if(!doc)
                                    common.serveError(env.res, 404, 'Object not found')
                                else
                                    common.serveJson(env.res, 200, doc)
                            })
                        }
                    })
                })
                break

            case 'PUT':
                // zmodyfikuj element w bazie danych, którego _id jest równe payload._id

                try {
                    if(specificity.inputTransformation) {
                        specificity.inputTransformation(env.parsedPayload)
                    }
                    let _id = db.ObjectId(env.parsedPayload._id)
                    let validateUpdate = specificity.validateUpdate
                    if(!validateUpdate) validateUpdate = function(payload, nextTick) { nextTick(true) }
                    validateUpdate(env.parsedPayload, function(ok) {
                        if(!ok) {
                            common.serveError(env.res, 400, 'Validation failed, findOneAndUpdate suppressed')
                            return
                        }
                        delete env.parsedPayload._id
                        collection.findOneAndUpdate({ _id: _id }, { $set: env.parsedPayload }, {}, function(err, result) {
                            if(err) 
                                common.serveError(env.res, 400, err.message)
                            else {
                                dbrest.getOneObject(collection, specificity.aggregation, _id, function(err, doc) {
                                    if(err)
                                       common.serveError(env.res, 400, err.message)
                                    else if(!doc)
                                        common.serveError(env.res, 404, 'Object not found')
                                    else
                                        common.serveJson(env.res, 200, doc)
                                })
                            }
                        })
        
                    })
                } catch(ex) {
                    common.serveError(env.res, 400, ex.message)
                }
                break

            default:
                common.serveError(env.res, 405, 'Method not implemented')
        }
        return
    }

}