const execa = require('execa')
execa.commandSync(`docker push registry.gitlab.com/shardeum/server:dev`, { stdio: [0, 1, 2] })
