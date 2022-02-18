const execa = require('execa')

try {
  execa.commandSync(`docker build -t registry.gitlab.com/shardeum/server:dev -f dev.Dockerfile .`, { stdio: [0, 1, 2] })
} catch (error) {
  execa.commandSync(`sudo docker build -t registry.gitlab.com/shardeum/server:dev -f dev.Dockerfile .`, { stdio: [0, 1, 2] })
}
