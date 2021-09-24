var mongodb = require('mongodb')

const db = module.exports = {

    persons: null,
    projects: null,
    tasks: null,

    auth: null,

    ObjectId: mongodb.ObjectId,

    init: function(dbUrl, dbName, nextTick) {
        mongodb.MongoClient.connect(dbUrl, { useUnifiedTopology: true }, function(err, conn) {
            if(err) {
                throw new Error(err.message)
            }
            console.log('Połączenie z bazą', dbName, 'na', dbUrl, 'zestawione')
            var adb = conn.db(dbName)
            db.persons = adb.collection('persons')
            db.persons.countDocuments(function(err, n) {
                if(err) {
                    throw new Error(err.message)
                }
                console.log('Liczba obiektów w kolekcji persons', n)                    
            })
            db.projects = adb.collection('projects')
            db.projects.countDocuments(function(err, n) {
                if(err) {
                    throw new Error(err.message)
                }
                console.log('Liczba obiektów w kolekcji projects', n)                    
            })
            db.tasks = adb.collection('tasks')
            db.tasks.countDocuments(function(err, n) {
                if(err) {
                    throw new Error(err.message)
                }
                console.log('Liczba obiektów w kolekcji tasks', n)                    
            })

            db.auth = adb.collection('auth')
            nextTick()
        })
    }

}