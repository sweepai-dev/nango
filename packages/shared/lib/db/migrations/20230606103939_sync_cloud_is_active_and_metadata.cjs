const TABLE = '_nango_sync_configs';

exports.up = async function (knex, _) {
    await knex.schema.withSchema('nango').alterTable(TABLE, function (table) {
        table.boolean('active').defaultTo(false);
        table.string('runs');
    });
};

exports.down = async function (knex, _) {
    await knex.schema.withSchema('nango').alterTable(TABLE, function (table) {
        table.dropColumn('active');
        table.dropColumn('runs');
    });
};
