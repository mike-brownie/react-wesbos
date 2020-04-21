const Mutation = {
    async createItem(parent, args, ctx, info) {
        // check for login 
        const item = await ctx.db.mutation.createItem({
            data: {
                ...args
            }
        }, info); 

        return item 
    }
};

module.exports = Mutation;
