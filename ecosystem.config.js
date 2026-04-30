module.exports = {
  apps: [
    {
      name: "paseo-user",
      script: "npm",
      args: "start",
      cwd: "/var/www/app/thepaseo-user",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
}