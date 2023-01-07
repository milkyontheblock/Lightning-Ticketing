function log(msg, title) {
    const ts = new Date().toISOString();
    const t = title ? title : 'LOG';
    console.log(`[${ts}] ${t}: ${msg}`);
}

module.exports = {
    log
};