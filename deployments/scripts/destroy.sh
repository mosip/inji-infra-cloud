kubectl delete clusterrolebinding cluster-admin-binding
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml
kubectl delete ns
kubectl delete ns cert-manager
kubectl delete ns kafka