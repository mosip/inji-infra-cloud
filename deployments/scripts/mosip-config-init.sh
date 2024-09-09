#!/bin/sh
apt-get update
apt-get install jq gettext -y

MIMOTO_PROPERTIES=deployments/mimoto-default.properties
UPDATED_MIMOTO_PROPERTIES=mimoto-default.properties

MIMOTO_ISSUERS_CONFIG=deployments/mimoto-issuers-config.json
UPDATED_MIMOTO_ISSUERS_CONFIG=mimoto-issuers-config.json

export ESIGNET_HOST=$1
export INJI_HOST=$2

envsubst < $MIMOTO_PROPERTIES  > $UPDATED_MIMOTO_PROPERTIES
envsubst < $MIMOTO_ISSUERS_CONFIG  > $UPDATED_MIMOTO_ISSUERS_CONFIG

kubectl create configmap mimoto-local-properties -n esignet --from-file=$UPDATED_MIMOTO_PROPERTIES --from-file=$UPDATED_MIMOTO_ISSUERS_CONFIG -o yaml --dry-run=client | kubectl apply -f - -n esignet

#kubectl rollout restart deploy esignet -n esignet

#kubectl wait pod --all --for=jsonpath='{.status.phase}'=Running  -n esignet

echo "mimoto config map created"