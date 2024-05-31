#!/bin/bash

getsite(){
curl 'https://api.canonn.tech/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'DNT: 1' -H 'Origin: https://api.canonn.tech' --data-binary "{\"query\":\"{grsite (id: $1) { siteID system{ systemName } body { bodyName } type { type } latitude longitude verified discoveredBy { cmdrName } activeGroups { activeGroup { groupName amount } } activeObelisks { activeObelisk { grObeliskGroup{ groupName } obeliskNumber broken verified grCodexData { grCodexCategory { categoryName } codexNumber grPrimaryArtifact { artifactName } grSecondaryArtifact { artifactName }} } } } }\"}" --compressed 
}

for i in {1..335}; do
getsite $i > $i.json
done

