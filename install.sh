if which node > /dev/null
    then
        echo "Node is already installed, skipping..."
    else
        curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
        sudo apt-get install -y nodejs
fi
(cd src && npm i -g pm2)
(cd src && npm i)