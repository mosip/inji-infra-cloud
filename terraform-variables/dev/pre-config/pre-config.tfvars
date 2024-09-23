projectInfo = {
  region = "asia-south1"
  name   = "inji-demo"
}

networkInfo = {
  name                    = "inji-demo-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460
  gke_subnet = {
    name          = "inji-demo-gke-subnet"
    ip_cidr_range = "10.0.0.0/24"
    pods_ip_range = {
      range_name    = "pods-range"
      ip_cidr_range = "10.2.0.0/16"
    }
    services_ip_range = {
      range_name    = "servicess-range"
      ip_cidr_range = "10.3.0.0/16"
    }
  },
  operations_subnet = {
    name          = "inji-demo-operations-subnet",
    ip_cidr_range = "10.0.3.0/24"
  }
}

firewallPolicyInfo = {
  name        = "inji-demo-nw-policy"
  description = ""
}

firewallPolicyAssocInfo = {
  name = "inji-demo-nw-policy-assoc"
}

firewallRuleInfo = [
  {
    name            = "inji-demo-allow-ssh"
    action          = "allow"
    description     = ""
    direction       = "INGRESS"
    disabled        = false
    enable_logging  = false
    firewall_policy = ""
    priority        = 100
    match = {
      src_ip_ranges = ["0.0.0.0/0"]
      layer4_configs = {
        ip_protocol = "tcp"
        ports       = ["22"]
      }
    }
  },
  {
    name            = "inji-demo-allow-http(s)"
    action          = "allow"
    description     = ""
    direction       = "INGRESS"
    disabled        = false
    enable_logging  = true
    firewall_policy = ""
    priority        = 101
    match = {
      src_ip_ranges = ["0.0.0.0/0"]
      layer4_configs = {
        ip_protocol = "tcp"
        ports       = ["80", "443"]
      }
    }
  },
  {
    name            = "inji-demo-allow-egress"
    action          = "allow"
    description     = ""
    direction       = "EGRESS"
    disabled        = false
    enable_logging  = false
    firewall_policy = ""
    priority        = 104
    match = {
      dest_ip_ranges = ["0.0.0.0/0"]
      layer4_configs = {
        ip_protocol = "tcp"
      }
    }
  }
]

lbipInfo = {
  name = "inji-demo-glb-lb-ip"
}

sql_ip_name = "inji-demo-sql-lb-ip"

natipInfo = {
  name = "inji-demo-nat-gw-ip"
}

routerInfo = {
  name = "inji-demo-router"
  routerNAT = {
    name = "inji-demo-router-nat-gw"
  }
}

artifactRegistryInfo = {
  name        = "inji-demo-repo"
  description = "inji-demo repo"
  format      = "DOCKER"
}

sqlInfo = {
  instanceName = "inji-demo-pgsql"
  version      = "POSTGRES_16"
  settings = {
    tier         = "db-custom-2-8192"
    ipv4_enabled = false
  }
  protection = false
}

dbInfo = [
  {
    name         = "mosip_esignet"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "keycloak"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "esignet-keycloak"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "mosip_mockidentitysystem"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "registry"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "credentials"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "credential-schema"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "identity"
    instanceName = "inji-demo-pgsql"
  },
  {
    name         = "inji_certify"
    instanceName = "inji-demo-pgsql"
  }
]


opsVMInfo = {
  name         = "inji-demo-ops-vm"
  ip_name      = "inji-demo-opsvm-pub-ip"
  machine_type = "n2d-standard-2"
  zone         = "asia-south1-a"
  boot_disk = {
    image = "ubuntu-os-cloud/ubuntu-2204-lts"
  }
}

secretInfo = {
  name = "inji-demo"
}

clusterInfo = {
  name                              = "inji-demo-cluster"
  initial_node                      = 1
  deletion_protection               = false
  networking_mode                   = "VPC_NATIVE"
  release_channel                   = "UNSPECIFIED"
  remove_default_pool               = true
  network_policy                    = true
  pod_autoscale                     = true
  gcsfuse_csi                       = true
  private_cluster_config            = null
  master_authorized_networks_config = null

  private_cluster_config = {
    enable_private_nodes        = true
    enable_private_endpoint     = false
    master_ipv4_cidr_block      = "10.0.6.0/28"
    master_global_access_config = false
  }
  master_authorized_networks_config = {
    gcp_public_cidrs_access_enabled = false
  }

  nodepool_config = [
    {
      name              = "worker-pool"
      machine_type      = "n2d-standard-4"
      initial_node      = 1
      max_node          = 6
      max_pods_per_node = 50
      min_node          = 1
    }
  ]
}

redisInfo = {
  instanceName = "inji-demo-redis"
  instanceName = "inji-demo-redis"
  version      = "REDIS_7_0"
  protection   = false,
  memorySize   = 1
}