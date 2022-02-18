const execa = require('execa')

try {
  execa.commandSync(`docker push registry.gitlab.com/shardeum/server:dev`, { stdio: [0, 1, 2] })
} catch (error) {
  execa.commandSync(`sudo docker push registry.gitlab.com/shardeum/server:dev`, { stdio: [0, 1, 2] })
}
