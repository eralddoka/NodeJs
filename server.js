require('dotenv').config();
const Hapi = require('@hapi/hapi');
const GitHub = require('github-api');
const mongoose = require('mongoose');
const Repos = require('./models/Repos');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            cors: true
        }
    });

    server.app.db = mongoose.connect(
        process.env.DATABASE_CONN, {useNewUrlParser: true},
        () => console.log('Connected with db')
    );

    server.route([
    {
        method: 'POST',
        path: '/userAuth',
        handler: async (request, h) => {
            const user = request.payload;
            let response;
            
            let gh = new GitHub({
                username: user.name,
                password: user.pass
             });
            
            await gh.getUser(user.name).getProfile(function(err, profile) {
                if(err){
                 response = 'Wrong username/password';
                }
                else{ 
                  response = profile;
                }
             });
            return response;
        }
    },
    {
        method: 'GET',
        path: '/userStarredRepos/{username}',
        handler: async (request, h) => {
    
           const username = request.params.username;
           let gh = new GitHub();
           let response;
           await gh.getUser(username).listStarredRepos(function(err, repos) {
                if(err){
                  response = 'Something went wrong';
                }
                else {
                    response = repos;
                    newRepo = {
                        username: username,
                        repos: repos
                    }
                    Repos.findOne({
                        username: username
                    }).then(repo =>{
                        if(!repo){
                          Repos.create(newRepo)
                          .then(repo => console.log('Repo saved!'))
                          .catch(err => console.log(err));
                        }
                    })
                }
            });
            return response;
        }
    }
]);
    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();