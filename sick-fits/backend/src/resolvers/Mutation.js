const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

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
    signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token');
        return { message: 'Goodbye!' };
    },
    async requestReset(parent, args, ctx, info) {
        // check if real user
        const user = await ctx.db.query.user({ where: { email: args.email }});
        if(!user) { 
            throw new Error(`No such user found for email ${args.email}.`);
        };
        // reset token and expiry
        const randomBytesPromiseified = promisify(randomBytes);
        const resetToken = (await randomBytesPromiseified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour == 3600000 seconds
        const res = await ctx.db.mutation.updateUser({
                where: { email: args.email },
                data: { resetToken: resetToken, resetTokenExpiry },
    });
    console.log(res);
    // email them token (TBD)
    return { message: `Thanks!`};
    },
    async resetPassword(parent, args, ctx, info) {
        // check if pwds match 
        if(args.password !== args.confirmPassword) {
            throw new Error(`Your passwords don't match.`);
        }
        // check if legit token 
        // check if expired 
        const [user] = await ctx.db.query.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            },
        });
        if(!user) {
            throw new Error(`Invalid or expired token.`);
        }
        // hash new pwd
        const password = await bcrypt.hash(args.password, 10);
        // save new pwdhash to db and reset token
        const updatedUser = await ctx.db.mutation.updateUser({
            where: { email: user.email }, 
            data: { 
                password, 
                resetToken: null, 
                resetTokenExpiry: null,
            },
        });
        // generate jwt 
        const token = jwt.sign({ userId: updatedUser.id}, process.env.APP_SECRET);
        // set jwt cookie 
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        // return user
        return updatedUser; 
    }
};

module.exports = Mutations;
