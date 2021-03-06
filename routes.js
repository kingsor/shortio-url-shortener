const Joi = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const createHash = require('./createhash');
const hashLen = 8; /* 8 chars long */
// Local machine? Set baseUrl to 'http://localhost:3000'
// It's important that you don't add the slash at the end
// or else, it will conflict with one of the routes
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

/* CREATING MONGOOSE SCHEMAS
 ================================================*/

const redirSchema = new Schema({
    shortUrl: String,
    url: String,
    createdAt: Date
}, {
        versionKey: false // You should be aware of the outcome after set to false
    });

const Redir = mongoose.model('Redir', redirSchema);

/* EXPORTING THE ROUTES
 ======================================================*/

module.exports = [
    // The array of routes goes here
    {
        method: 'GET',
        path: '/',
        handler(request, reply) {
            reply.file('views/index.html');
        }
    },
    {
        method: 'GET',
        path: '/public/{file}',
        handler(request, reply) {
            reply.file(`public/${request.params.file}`);
        }
    },
    {
        method: 'POST',
        path: '/new',
        handler(request, reply) {
            const uniqueID = createHash(hashLen);
            const newRedir = new Redir({
                shortUrl: `${baseUrl}/${uniqueID}`,
                url: request.payload.url,
                createdAt: new Date()
            });

            newRedir.save((err, redir) => {
                if (err) { reply(err); } else { reply(redir); }
            });
        },
        config: {
            validate: {
                payload: {
                    url: Joi.string()
                        .regex(/^https?:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)
                        .required()
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/{hash}',
        handler(request, reply) {
            const query = {
                'shortUrl': `${baseUrl}/${request.params.hash}`
            };

            Redir.findOne(query, (err, redir) => {
                if (err) { return reply(err); }
                else if (redir) { reply().redirect(redir.url); }
                else { reply.file('views/404.html').code(404); }
            });
        }
    }
];