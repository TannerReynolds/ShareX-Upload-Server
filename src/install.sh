if which node > /dev/null
    then
        echo "\x1b[32mNode is already installed, skipping...\x1b[0m"
    else
        curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
        sudo apt-get install -y nodejs
fi
npm i