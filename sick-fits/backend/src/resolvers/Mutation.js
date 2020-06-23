const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutations = {
    async createItem(parent, args, ctx, info) {
        // check for login 
        const item = await ctx.db.mutation.createItem({
            data: {
                ...args
            }
        }, info); 

        return item;
    },

    updateItem(parent, args, ctx, info) {
        // first take copy of updates 
        const updates = { ...args };
        // remove id from updates 
        delete updates.id;
        //run the update method 
        return ctx.db.mutation.updateItem(
        {
            data: updates, 
            where: { 
                id: args.id,
            },
        }, 
        info
    );
},
    async deleteItem(parent, args, ctx, info) {
        const where = { id: args.id };
        // find item
        const item = await ctx.db.query.item({ where }, `{ id title }`);

        // check permission
        
        // delete it
        return ctx.db.mutation.deleteItem({ where }, info);
    },
    async signup(parent, args, ctx, info) {
        args.email = args.email.toLowerCase();
        // hash password
        const password = await bcrypt.hash(args.password, 10);
        const user = await ctx.db.mutation.createUser({
            data: {
               ...args,
               password,
               permissions: { set: ['USER'] },
            },
        }, 
        info
        );
        // json web token 
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
            ctx.response.cookie('token', token, {
                httpOnly: true,
                // cookie lasts for 1 year 
                maxAge: 1000 * 60 * 60 * 24 * 365, 
        });
        return user;
    },
    async signin(parent, { email, password }, ctx, info) {
        //1. check if user with email 
        const user = await ctx.db.query.user({ where: { email } })
        if(!user) {
            throw new Error(`No such user found for email ${email}.`);
        }
        //2. check if pw correct 
        const valid = await bcrypt.compare(password, user.password);
        if(!valid) {
            throw new Error(`Invalid password.`);
            }
        //3. generate jwt 
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        //4. set cookie with token 
        ctx.response.cookie('token', token, { 
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, 
        });
        //5. return user
        return user; 
    },
};

module.exports = Mutations;
