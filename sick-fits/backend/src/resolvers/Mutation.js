const Mutation = {
    async createItem(parent, args, ctx, info) {
        // check for login 
        const item = await ctx.db.Mutation.createItem({
            data: {
                ...args
            }
        }, info)
    }
};

module.exports = Mutation;
