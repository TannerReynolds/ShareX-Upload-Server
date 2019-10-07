function auth(myKey, givenKey, c) {  
    if (c.key.includes(givenKey) || c.admin.key.includes(givenKey) || c.public === true || myKey === null) return true;
    return false; 
}
module.exports = auth;
