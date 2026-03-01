require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const result = await mongoose.connection.collection('caches').deleteMany({});
    console.log('Deleted', result.deletedCount, 'cache entries');
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
