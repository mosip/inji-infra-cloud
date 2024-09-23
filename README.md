# INJI, one-click deployment on GCP

![infra](./assets/inji_architecture.png)

## Introduction

## Deployment Approach

Deployment uses the following tools:

- **Terraform for GCP** - Infrastructure deployment
- **Helm chart** - Application/Microservices deployment
- **Cloud Build** - YAML scripts which acts as a wrapper around Terraform Deployment scripts

The entire Terraform deployment is divided into 3 stages -

- **Pre-Config** stage
    - Create the required infra for deployment
- **Setup** Stage
    - Deploy the Core  services

### Helm Chart Details
#### INJI
Currently, the below release version of the Helm charts will be deployed. The version can be updated in the [.env](.env) file if needed.

| Chart                      | Chart Version | Docker Image                 | Docker Version |
|----------------------------|---------------|------------------------------|----------------|
| mosip/inji-certify         | 0.9.0         | mosipid/inji-certify         | 0.9.0          |
| mosip/mimoto               | 0.13.1        | tejashjl/mimoto              | develop        |
| mosip/injiweb              | 0.9.0         | mosipdev/inji-web            | develop        |
| mosip/injiverify           | 0.9.0         | mosipqa/inji-verify          | latest         |

#### eSignet
Currently, the below release version of the Helm charts will be deployed. The version can be updated in the [deployments/.esignet.env](deployments/.esignet.env) file if needed.

| Chart                      | Chart Version | Docker Image                 | Docker Version       |
|----------------------------|---------------|------------------------------|----------------------|
| mosip/softhsm              | 12.0.1        | mosipid/softhsm              | v2                   |
| mosip/artifactory          | 12.0.1        | tejashjl/artifactory-server  | develop              |
| mosip/keycloak             | 7.1.18        | mosipid/mosip-keycloak       | 16.1.1-debian-10-r85 |
| mosip/postgres-init        | 12.0.1        | mosipid/postgres-init        | 1.2.0.1              |
| mosip/esignet              | 1.4.1         | mosipid/esignet              | 1.4.0                |
| mosip/oidc-ui              | 1.4.1         | mosipid/oidc-ui              | 1.4.0                |
| mosip/keycloak-init        | 12.0.1        | mosipid/keycloak-init        | 1.2.0.1              |
| mosip/mock-identity-system | 0.9.3         | mosipid/mock-identity-system | 0.9.3                |


#### RC
Currently, the below release version of the Helm charts will be deployed. The version can be updated in the [deployments/.registry.env](deployments/.registry.env) file if needed.

| Service                   | Docker Version |
|---------------------------|----------------|
| registry                  | v1.0.0         |
| credential_schema_service | v2.0.0-rc3     |
| credentials_service       | v2.0.0-rc3     |
| keycloak_service          | v1.0.0         |
| identity_service_version  | v2.0.0-rc3     |

### Pre-requisites

- #### [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install)

- #### Alternate

- #### [Run gcloud commands with Cloud Shell](https://cloud.google.com/shell/docs/run-gcloud-commands)

- [**Install kubectl**](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#apt)

  ```bash
  sudo apt-get update
  sudo apt-get install kubectl
  kubectl version --client
  
  sudo apt-get install google-cloud-sdk-gke-gcloud-auth-plugin
  ```

- [**Install Helm**](https://helm.sh/docs/intro/install/)

  ```bash
  curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
  
  sudo apt-get install apt-transport-https --yes
  
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
  
  sudo apt-get update
  sudo apt-get install helm
  
  helm version --client
  ```

### Workspace - Folder structure

- **(***Root Folder***)**
    - **assets**
        - images
        - architetcure diagrams
        - ...(more)
    - **builds**
        - **apps** - Deploy/Remove all Application services
        - **infra** - Deploy/Remove all Infrastructure components end to end
    - **deployments -** Store config files required for deployment
        - **configs**
            - Store config files required for deployment
        - **scripts**
            - Shell scripts required to deploy services
    - **terraform-scripts**
        - Deployment files for end to end Infrastructure deployment
    - **terraform-variables**
        - **dev**
            - **pre-config**
                - **pre-config.tfvars**
                    - Actual values for the variable template defined in **variables.tf** to be passed to **pre-config.tf**

### Infrastructure Deployment

![deploy-approach](./assets/deploy-approach.png)

## Step-by-Step guide

#### Setup CLI environment variables

```bash
PROJECT_ID=
OWNER=
GSA=$PROJECT_ID-sa@$PROJECT_ID.iam.gserviceaccount.com
GSA_DISPLAY_NAME=$PROJECT_ID-sa
REGION=asia-south1
ZONE=asia-south1-a
CLUSTER=
DOMAIN=
FR_DOMAIN=
ESIGNET_DOMAIN=
VERIFY_DOMAIN=
EMAIL_ID=
WEB_DID_BASE_URL=
alias k=kubectl
```

#### Authenticate user to gcloud

```bash
gcloud auth login
gcloud auth list
gcloud config set account $OWNER
```

#### Setup current project

```bash
gcloud config set project $PROJECT_ID

gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable cloudkms.googleapis.com
gcloud services enable certificatemanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable servicenetworking.googleapis.com

gcloud config set compute/region $REGION
gcloud config set compute/zone $ZONE
```

#### Setup Service Account

Current authenticated user will handover control to a **Service Account** which would be used for all subsequent resource deployment and management

```bash
gcloud iam service-accounts create $GSA_DISPLAY_NAME --display-name=$GSA_DISPLAY_NAME
gcloud iam service-accounts list

# Make SA as the owner
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$GSA --role=roles/owner

# ServiceAccountUser role for the SA
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$GSA --role=roles/iam.serviceAccountUser

# ServiceAccountTokenCreator role for the SA
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$GSA --role=roles/iam.serviceAccountTokenCreator
```

#### Deploy Infrastructure using Terraform

#### Teraform State management

```bash
# Maintains the Terraform state for deployment
gcloud storage buckets create gs://$PROJECT_ID-inji-state --project=$PROJECT_ID --default-storage-class=STANDARD --location=$REGION --uniform-bucket-level-access

# List all Storage buckets in the project to check the creation of the new one
gcloud storage buckets list --project=$PROJECT_ID
```

#### Pre-Config

##### Prepare Landing Zone

```bash
cd $BASEFOLDERPATH

# One click of deployment of infrastructure
gcloud builds submit --config="./builds/infra/deploy-script.yaml" \
--project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_SERVICE_ACCOUNT_=$SERVICE_ACCOUNT,_LOG_BUCKET_=$PROJECT_ID-inji-state

# Remove/Destroy infrastructure
/*
gcloud builds submit --config="./builds/infra/destroy-script.yaml" \
---project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_SERVICE_ACCOUNT_=$SERVICE_ACCOUNT,_LOG_BUCKET_=$PROJECT_ID-inji-state
*/
```

##### Output
```
...
Apply complete! Resources: 36 added, 0 changed, 0 destroyed.

Outputs:

lb_public_ip = "**.93.6.**"
sql_private_ip = "**.125.196.**"
```

_**Before moving to the next step, you need to create domain/sub-domain and create a DNS `A` type record pointing to `lb_public_ip`**_
**_You would the below domain/sub-domain to be configured for inji_**
- _FR_DOMAIN_ - Domain to integrate with Sunbird RC
- _ESIGNET_DOMAIN_ - Domain to integrate with eSignet
- _DOMAIN_ - Domain to integrate with inji modules
- _VERIFY_DOMAIN_ - Domain to integrate with inji verify module

**_You would also need a public github repository to host DIDs, and pass the github repo url using `WEB_DID_BASE_URL` env_**

#### Deploy service

##### Deploy Landing Zone

```bash
cd $BASEFOLDERPATH

# One click of deployment of services
#### The REGION,PROJECT_ID,GSA,EMAIL_ID,DOMAIN needs to be updated in the command below.

gcloud builds submit --config="./builds/apps/deploy-script.yaml" \
--region=$REGION --project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_REGION_="$REGION",_LOG_BUCKET_=$PROJECT_ID-inji-state,_EMAIL_ID_=$EMAIL_ID,_DOMAIN_=$DOMAIN,_SERVICE_ACCOUNT_=$GSA,_FR_DOMAIN_=$FR_DOMAIN,_ESIGNET_DOMAIN_=$ESIGNET_DOMAIN,_VERIFY_DOMAIN_=$VERIFY_DOMAIN,_WEB_DID_BASE_URL_=$WEB_DID_BASE_URL

# Remove/Destroy
#### The REGION,PROJECT_ID,GSA,EMAIL_ID,DOMAIN needs to be updated in the command below.

/*
gcloud builds submit --config="./builds/apps/destroy-script.yaml" \
--region=$REGION --project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_REGION_="$REGION",_LOG_BUCKET_=$PROJECT_ID-inji-state,_SERVICE_ACCOUNT_=$GSA,_FR_DOMAIN_=$FR_DOMAIN,_ESIGNET_DOMAIN_=$ESIGNET_DOMAIN,_VERIFY_DOMAIN_=$VERIFY_DOMAIN,_WEB_DID_BASE_URL_=$WEB_DID_BASE_URL
*/
```

#### Update esignet/certify/mimoto properties
Update the properties data in `/deployment` directory and run the below command to deploy the changes.
The detailed steps to execute the below command is provided in the below DEMO sections.

```bash
cd $BASEFOLDERPATH

gcloud builds submit --config="./builds/config-update/deploy-script.yaml" \
--region=$REGION --project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_REGION_="$REGION",_LOG_BUCKET_=$PROJECT_ID-inji-state,_EMAIL_ID_=$EMAIL_ID,_DOMAIN_=$DOMAIN,_SERVICE_ACCOUNT_=$GSA,_FR_DOMAIN_=$FR_DOMAIN,_ESIGNET_DOMAIN_=$ESIGNET_DOMAIN,_VERIFY_DOMAIN_=$VERIFY_DOMAIN

```

#### Mount pkcs12/p12 file to mimoto
The detailed steps to execute the below command is provided in the below DEMO sections.
You can follow either of the steps mentioned below:

**To generate and mount the pkcs12 file through automated scripts**
- Create a `key.jwk` in `directory/secrets` directory with the private key jwk that was used to create a OIDC client
- Run the below command to generate a pkcs12 file and mount it to mimoto
```bash
 gcloud.cmd builds submit --region=$REGION --config="./builds/p12-import/deploy-script.yaml" --project=$PROJECT_ID \
 --substitutions=_PROJECT_ID_=$PROJECT_ID,_REGION_=$REGION,_LOG_BUCKET_=$PROJECT_ID-inji-state,_SERVICE_ACCOUNT_=$GSA
```
**To generate and mount the pkcs12 file manually**
- Create a `key.jwk` in a directory with the private key jwk that was used to create a OIDC client
- Run the below script to generate a pkcs12 file
```bash
npm install -g cli-jwk-to-pem
jwk=$(cat key.jwk)
jwk-to-pem --jwk $jwk > key.pem

openssl req -new -sha256 -key key.pem -out csr.csr -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com"

openssl req -x509 -sha256 -days 365 -key key.pem -in csr.csr -out certificate.pem

export pass=$(cat deployments/mimoto-default.properties | grep "mosip.oidc.p12.password" | sed  -e 's/mosip.oidc.p12.password=//g')
openssl pkcs12 -export -out oidckeystore.p12 -inkey key.pem -in certificate.pem --name esignet-sunbird-partner -passout env:pass
```
- Run the below script to mount the pkcs12 file to mimoto service
```bash
kubectl create secret generic mimotooidc -n esignet --from-file=oidckeystore.p12
kubectl rollout restart deploy mimoto -n esignet
```


## Connect to the Cluster through bastion host

```bash
gcloud compute instances list
gcloud compute ssh inji-demo-ops-vm --zone=$ZONE
gcloud container clusters get-credentials inji-demo-cluster --project=$PROJECT_ID --region=$REGION

kubectl get nodes
kubectl get pods -n $NS
kubectl get svc -n ingress-nginx
```


### Steps to connect to Psql
- Run the below command in bastion host
- Install psql client
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```
- Run below command to access psql password
```bash
gcloud secrets versions access latest --secret inji-demo
```
- Run below command to get private ip of sql
```bash
 gcloud sql instances describe inji-demo-pgsql --format=json  | jq -r ".ipAddresses"
```
- Connect to psql
```bash
psql "sslmode=require hostaddr=PRIVATE_IP user=postgres dbname=postgres"
```


### Steps to access keycloak password
- Run the below command in bastion host
```bash
 echo Password: $(kubectl get secret --namespace inji keycloak -o jsonpath="{.data.admin-password}" | base64 --decode)
```

### Steps to access keycloak client secret
- Run the below command in bastion host
```bash
 echo Secret: $(kubectl get secrets keycloak-client-secrets -n esignet -o jsonpath="{.data.mosip_pms_client_secret}" | base64 --decode)
```


### DEMO
The postman collection (along with env config) has been provided in `postman_collections` directory.

Open postman and import both the collection and environment collections

- Select the `inji-env` environment from the dropdown
- Update `REGISTRY_HOST` env with _FR_DOMAIN_ value
- Update `ESIGNET_HOST` env with _ESIGNET_DOMAIN_ value
- Update `INJI_HOST` env with _DOMAIN_ value
- Update `client_secret` env with the keycloak secret value, by running the below cmd,
```bash
  echo Secret: $(kubectl get secrets keycloak-client-secrets -n esignet -o jsonpath="{.data.mosip_pms_client_secret}" | base64 --decode)
```

**1. Function Registry Setup**

You can follow the below steps to initialize RC, you can trigger the apis in the given order in `RC` directory of the postman collection.
- Now generate a DID(POST /did/generate) and create a credential schema(POST /credential-schema)
  - take note of $.schema[0].author and $.schema[0].id from the create credential schema request
  - host the output of the JSON to the GitHub pages repo created earlier
- Modify the properties of the Esignet and Certify services located in the deployments/esignet-local.properties and deployments/certify-local.properties files respectively.
  - Include Issuer ID and credential schema ID for the following properties:
  - esignet-default-properties:
    - mosip.esignet.vciplugin.sunbird-rc.credential-type.{credential type}.static-value-map.issuerId.
    - mosip.esignet.vciplugin.sunbird-rc.credential-type.{credential-type}.cred-schema-id.
  - certify-default.properties:
    - mosip.certify.vciplugin.sunbird-rc.credential-type.{credential type}.static-value-map.issuerId.
    - mosip.certify.vciplugin.sunbird-rc.credential-type.{credential-type}.cred-schema-id.
  - The `$.schema[0].author` DID goes to the config ending in issuerId and `$.schema[0].id` DID goes to the config ending in cred-schema-id.
- Trigger all the 11 Apis listed in the `RC` directory in the postman collections
- Next, trigger the deploy script to update the properties of esignet/certify services
```bash
gcloud builds submit --config="./builds/config-update/deploy-script.yaml" \
--region=$REGION --project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_REGION_="$REGION",_LOG_BUCKET_=$PROJECT_ID-inji-state,_EMAIL_ID_=$EMAIL_ID,_DOMAIN_=$DOMAIN,_SERVICE_ACCOUNT_=$GSA,_FR_DOMAIN_=$FR_DOMAIN,_ESIGNET_DOMAIN_=$ESIGNET_DOMAIN
```

**2. eSignet Setup**

- You can now create a OIDC Client, goto `eSignet/OIDC Client Mgmt` section in postman collection and trigger all the APIs to create a OIDC client
- Copy `privateKey_jwk` env value from postman environment and update `deployments\secrets\key.jwk` file
- Run the below command to mount the private key as p12 file to mimoto service
```bash
gcloud builds submit --config="./builds/config-update/deploy-script.yaml" \
--region=$REGION --project=$PROJECT_ID --substitutions=_PROJECT_ID_=$PROJECT_ID,\
_REGION_="$REGION",_LOG_BUCKET_=$PROJECT_ID-inji-state,_EMAIL_ID_=$EMAIL_ID,_SERVICE_ACCOUNT_=$GSA
```
- Next you can run the apis in `eSignet/KBA` and verify if you are able to access the credential

**3. Inji Web Demo**

Next you can test the inji web by following the below steps:
- Launch the Inji Web application in your web browser (Use _DOMAIN_)
- In the Home page, from the section, List of Issuers section, click on issuers' tile to land in Credential Types selection page.
- Click on a Credential Type tile and authenticate in the eSignet page by providing the required details.
- Provide the patient details that was created in the postman collection, For ex: Patient ID: p-123, Patient Name: ram, Patient DoB: 14-09-2024
- Credential is downloaded in the background and PDF will be generated and stored in the Downloads folder of the system.
- Upon successful PDF generation, user can view the PDF of the downloaded VC

**4. Mobile Wallet Demo**

Next you can test the inji wallet by following the below steps:
- Launch the Inji Wallet application in your simulator/phone
- After the app setup you can follow the same steps provided above to download the VC for the user.

**5. Inji Verify Demo**

Next you can test the inji verify by following the below steps:
- Launch the Inji Verify application in your mobile browser (Use _VERIFY_DOMAIN_)
- In the Home page, select `Scan the QR Code` tab and scan the qr code present in the PDF file that was downloaded in the previous step.
- If QR code is valid, the details of the VC and status will be shown

