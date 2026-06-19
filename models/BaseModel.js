const { query } = require('../config/db');

class IdValue {
  constructor(value) {
    this.value = value === null || value === undefined ? null : Number(value);
  }

  equals(other) {
    return this.toString() === normalizeValue(other)?.toString();
  }

  toString() {
    return this.value === null ? '' : String(this.value);
  }

  valueOf() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

const normalizeValue = (value) => {
  if (value instanceof IdValue) return value.valueOf();
  if (value && typeof value === 'object' && value._id !== undefined) return normalizeValue(value._id);
  if (value instanceof Date) return value;
  return value;
};

const toSqlDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const clonePlain = (value) => JSON.parse(JSON.stringify(value));

const hydrateIdFields = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof IdValue) return value;
  if (Array.isArray(value)) return value.map(hydrateIdFields);
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;

  const result = {};
  Object.entries(value).forEach(([key, item]) => {
    if ((key === '_id' || key === 'id') && item !== null && item !== undefined && !Number.isNaN(Number(item))) {
      result[key] = new IdValue(item);
    } else {
      result[key] = hydrateIdFields(item);
    }
  });
  return result;
};

const serializeValue = (value) => {
  if (value instanceof IdValue) return value.toJSON();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    const result = {};
    Object.entries(value).forEach(([key, item]) => {
      result[key] = serializeValue(item);
    });
    return result;
  }
  return value;
};

const applyUpdatePayload = (doc, update) => {
  const payload = update || {};

  if (payload.$set) {
    Object.assign(doc, payload.$set);
  }

  if (payload.$push) {
    Object.entries(payload.$push).forEach(([field, value]) => {
      if (!Array.isArray(doc[field])) doc[field] = [];
      doc[field].push(normalizeValue(value));
    });
  }

  if (payload.$pull) {
    Object.entries(payload.$pull).forEach(([field, value]) => {
      if (!Array.isArray(doc[field])) return;
      const values = value && value.$in ? value.$in.map((item) => normalizeValue(item)?.toString()) : [normalizeValue(value)?.toString()];
      doc[field] = doc[field].filter((item) => !values.includes(normalizeValue(item)?.toString()));
    });
  }

  Object.entries(payload).forEach(([field, value]) => {
    if (!field.startsWith('$')) doc[field] = value;
  });
};

class QueryBuilder {
  constructor(model, options = {}) {
    this.model = model;
    this.conditions = options.conditions || {};
    this.single = Boolean(options.single);
    this.deleteOne = Boolean(options.deleteOne);
    this.selection = null;
    this.populates = [];
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.asLean = false;
  }

  select(selection) {
    this.selection = selection;
    return this;
  }

  populate(path, select) {
    if (typeof path === 'string' && path.includes(' ') && select === undefined) {
      path.split(/\s+/).filter(Boolean).forEach((item) => this.populates.push({ path: item }));
      return this;
    }

    if (typeof path === 'object') {
      this.populates.push(path);
      return this;
    }

    this.populates.push({ path, select });
    return this;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  skip(count) {
    this.skipCount = Number(count) || 0;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  lean() {
    this.asLean = true;
    return this;
  }

  async exec() {
    const records = this.deleteOne
      ? await this.model.findInternal(this.conditions, { sort: this.sortSpec, limit: 1, offset: this.skipCount })
      : await this.model.findInternal(this.conditions, {
          sort: this.sortSpec,
          limit: this.single ? 1 : this.limitCount,
          offset: this.skipCount
        });

    if (this.deleteOne) {
      const doc = records[0] || null;
      if (doc) await this.model.deleteMany({ _id: doc._id });
      return this.finalize(doc);
    }

    const value = this.single ? records[0] || null : records;
    return this.finalize(value);
  }

  async finalize(value) {
    if (Array.isArray(value)) {
      for (const doc of value) {
        await this.applyPopulates(doc);
      }
      const selected = value.map((doc) => this.model.applySelection(doc, this.selection));
      return this.asLean ? selected.map((doc) => doc.toObject()) : selected;
    }

    if (value) {
      await this.applyPopulates(value);
      value = this.model.applySelection(value, this.selection);
    }

    return this.asLean && value ? value.toObject() : value;
  }

  async applyPopulates(doc) {
    for (const populate of this.populates) {
      await this.model.populateDocument(doc, populate);
    }
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class BaseModel {
  constructor(data = {}, options = {}) {
    Object.assign(this, hydrateIdFields(this.constructor.applyDefaults(data)));
    this._isNew = options.isNew !== false;
    this._original = clonePlain(this.toObject());
  }

  static get table() {
    throw new Error('Model table is not defined');
  }

  static get columns() {
    return {};
  }

  static get jsonFields() {
    return [];
  }

  static get dateFields() {
    return [];
  }

  static get booleanFields() {
    return [];
  }

  static get refFields() {
    return {};
  }

  static get defaults() {
    return {};
  }

  static get virtualPopulates() {
    return {};
  }

  static modelFor(name) {
    const models = {
      User: () => require('./Users'),
      Users: () => require('./Users'),
      Tools: () => require('./Tools'),
      Tool: () => require('./Tools'),
      Cart: () => require('./Cart'),
      ExchangeRequest: () => require('./ExchangeRequest'),
      Exchange: () => require('./ExchangeRequest'),
      Notification: () => require('./Notification'),
      Problem: () => require('./Problem'),
      Solution: () => require('./Solution')
    };

    return models[name]?.();
  }

  static rowToData(row) {
    const data = { _id: new IdValue(row.id) };

    Object.entries(this.columns).forEach(([prop, column]) => {
      let value = row[column];
      if (this.jsonFields.includes(prop)) value = parseJson(value, []);
      if (this.booleanFields.includes(prop)) value = Boolean(value);
      if (this.refFields[prop] && value !== null && value !== undefined) value = new IdValue(value);
      data[prop] = value;
    });

    return data;
  }

  static dataToColumns(data) {
    const columns = {};

    Object.entries(this.columns).forEach(([prop, column]) => {
      if (data[prop] === undefined) return;
      let value = normalizeValue(data[prop]);
      if (this.jsonFields.includes(prop)) value = JSON.stringify(value || []);
      if (this.booleanFields.includes(prop)) value = value ? 1 : 0;
      if (this.dateFields.includes(prop)) value = toSqlDate(value);
      columns[column] = value;
    });

    return columns;
  }

  static hydrate(row) {
    return new this(this.rowToData(row), { isNew: false });
  }

  static applyDefaults(data = {}) {
    const result = { ...data };

    Object.entries(this.defaults).forEach(([field, value]) => {
      if (result[field] === undefined) {
        result[field] = typeof value === 'function' ? value() : clonePlain(value);
      }
    });

    return result;
  }

  static find(conditions = {}) {
    return new QueryBuilder(this, { conditions });
  }

  static findOne(conditions = {}) {
    return new QueryBuilder(this, { conditions, single: true });
  }

  static findById(id) {
    return this.findOne({ _id: id });
  }

  static async create(data) {
    const doc = new this(this.applyDefaults(data));
    await doc.save();
    return doc;
  }

  static async insertMany(records) {
    const saved = [];
    for (const record of records) {
      saved.push(await this.create(record));
    }
    return saved;
  }

  static async countDocuments(conditions = {}) {
    const { where, params } = this.buildWhere(conditions);
    const rows = await query(`SELECT COUNT(*) AS count FROM ${this.table}${where}`, params);
    return Number(rows[0]?.count || 0);
  }

  static async findInternal(conditions = {}, options = {}) {
    const { where, params } = this.buildWhere(conditions);
    const order = this.buildOrder(options.sort);
    const limit = options.limit ? ` LIMIT ${Number(options.limit)}` : '';
    const offset = options.offset ? ` OFFSET ${Number(options.offset)}` : '';
    const rows = await query(`SELECT * FROM ${this.table}${where}${order}${limit}${offset}`, params);
    return rows.map((row) => this.hydrate(row));
  }

  static findOneAndDelete(conditions = {}) {
    return new QueryBuilder(this, { conditions, deleteOne: true });
  }

  static async findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  }

  static async deleteMany(conditions = {}) {
    const { where, params } = this.buildWhere(conditions);
    const result = await query(`DELETE FROM ${this.table}${where}`, params);
    return { deletedCount: result.affectedRows || 0 };
  }

  static async findOneAndUpdate(conditions = {}, update = {}, options = {}) {
    const doc = await this.findOne(conditions);
    if (!doc) return null;
    applyUpdatePayload(doc, update);
    await doc.save();
    return options.new === false ? null : doc;
  }

  static async findByIdAndUpdate(id, update = {}, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  static async updateMany(conditions = {}, update = {}) {
    const docs = await this.find(conditions);
    for (const doc of docs) {
      applyUpdatePayload(doc, update);
      await doc.save();
    }
    return { modifiedCount: docs.length };
  }

  static buildWhere(conditions = {}) {
    const parts = [];
    const params = [];

    const appendCondition = (field, value) => {
      const column = this.columnFor(field);
      if (!column) {
        parts.push(this.unknownCondition(value));
        return;
      }

      if (value && typeof value === 'object' && !(value instanceof IdValue) && !(value instanceof Date) && !Array.isArray(value) && value._id === undefined) {
        Object.entries(value).forEach(([operator, operand]) => {
          switch (operator) {
            case '$ne':
              parts.push(`(${column} IS NULL OR ${column} <> ?)`);
              params.push(normalizeValue(operand));
              break;
            case '$in':
              if (this.jsonFields.includes(field)) {
                parts.push(`JSON_OVERLAPS(${column}, CAST(? AS JSON))`);
                params.push(JSON.stringify(operand.map(normalizeValue)));
              } else if (operand.length === 0) {
                parts.push('1 = 0');
              } else {
                parts.push(`${column} IN (${operand.map(() => '?').join(', ')})`);
                params.push(...operand.map(normalizeValue));
              }
              break;
            case '$gt':
              parts.push(`${column} > ?`);
              params.push(this.dateFields.includes(field) ? toSqlDate(operand) : normalizeValue(operand));
              break;
            case '$gte':
              parts.push(`${column} >= ?`);
              params.push(normalizeValue(operand));
              break;
            case '$lte':
              parts.push(`${column} <= ?`);
              params.push(normalizeValue(operand));
              break;
            case '$regex':
              parts.push(`${column} LIKE ?`);
              params.push(`%${operand}%`);
              break;
            case '$options':
              break;
            default:
              parts.push(`${column} = ?`);
              params.push(normalizeValue(operand));
          }
        });
        return;
      }

      if (value === null) {
        parts.push(`${column} IS NULL`);
      } else {
        parts.push(`${column} = ?`);
        params.push(normalizeValue(value));
      }
    };

    Object.entries(conditions || {}).forEach(([field, value]) => {
      if (field === '$or' && Array.isArray(value)) {
        const orParts = value.map((item) => this.buildWhere(item)).filter((item) => item.where);
        if (orParts.length) {
          parts.push(`(${orParts.map((item) => item.where.replace(/^ WHERE /, '')).join(' OR ')})`);
          orParts.forEach((item) => params.push(...item.params));
        }
        return;
      }

      appendCondition(field, value);
    });

    return {
      where: parts.length ? ` WHERE ${parts.join(' AND ')}` : '',
      params
    };
  }

  static unknownCondition(value) {
    if (value && typeof value === 'object' && value.$ne !== undefined) return '1 = 1';
    return '1 = 0';
  }

  static columnFor(field) {
    if (field === '_id' || field === 'id') return 'id';
    return this.columns[field];
  }

  static buildOrder(sortSpec) {
    if (!sortSpec) return '';

    if (typeof sortSpec === 'string') {
      const direction = sortSpec.startsWith('-') ? 'DESC' : 'ASC';
      const field = sortSpec.replace(/^-/, '');
      const column = this.columnFor(field);
      return column ? ` ORDER BY ${column} ${direction}` : '';
    }

    const parts = Object.entries(sortSpec)
      .map(([field, direction]) => {
        const column = this.columnFor(field);
        return column ? `${column} ${Number(direction) < 0 ? 'DESC' : 'ASC'}` : null;
      })
      .filter(Boolean);

    return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
  }

  static applySelection(doc, selection) {
    if (!doc || !selection) return doc;
    const tokens = String(selection).split(/\s+/).filter(Boolean);
    if (!tokens.length) return doc;

    const plain = doc.toObject({ keepIds: true });
    const includeMode = tokens.some((token) => !token.startsWith('-') && !token.startsWith('+'));

    if (includeMode) {
      const selected = { _id: plain._id };
      tokens.forEach((token) => {
        if (token.startsWith('-') || token.startsWith('+')) return;
        if (plain[token] !== undefined) selected[token] = plain[token];
      });
      return new this(selected, { isNew: false });
    }

    tokens.forEach((token) => {
      if (token.startsWith('-')) delete plain[token.slice(1)];
    });

    return new this(plain, { isNew: false });
  }

  static async populateDocument(doc, populate) {
    if (!doc) return doc;
    const config = typeof populate === 'string' ? { path: populate } : populate;
    const path = config.path;
    const virtual = this.virtualPopulates[path];

    if (virtual) {
      const RelatedModel = this.modelFor(virtual.model);
      let related = await RelatedModel.find({ [virtual.foreignField]: doc[virtual.localField] });
      if (config.match) related = related.filter((item) => matchesPlain(item, config.match));
      for (const item of related) {
        if (config.populate) await RelatedModel.populateDocument(item, config.populate);
      }
      doc[path] = related.map((item) => RelatedModel.applySelection(item, config.select));
      return doc;
    }

    const refName = this.refFields[path];
    if (!refName) return doc;

    const RelatedModel = this.modelFor(refName);
    const id = doc[path];
    if (!id) {
      doc[path] = null;
      return doc;
    }

    let related = await RelatedModel.findById(id);
    if (related && config.match && !matchesPlain(related, config.match)) related = null;
    if (related && config.populate) await RelatedModel.populateDocument(related, config.populate);
    doc[path] = related ? RelatedModel.applySelection(related, config.select) : null;
    return doc;
  }

  async save(_options = {}) {
    if (this.constructor.beforeSave) await this.constructor.beforeSave(this);
    const columns = this.constructor.dataToColumns(this);

    if (this._isNew || !this._id) {
      const entries = Object.entries(columns);
      const names = entries.map(([column]) => column);
      const params = entries.map(([, value]) => value);
      const placeholders = names.map(() => '?').join(', ');
      const result = await query(`INSERT INTO ${this.constructor.table} (${names.join(', ')}) VALUES (${placeholders})`, params);
      this._id = new IdValue(result.insertId);
      this._isNew = false;
    } else {
      const entries = Object.entries(columns);
      const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
      const params = [...entries.map(([, value]) => value), normalizeValue(this._id)];
      await query(`UPDATE ${this.constructor.table} SET ${assignments} WHERE id = ?`, params);
    }

    this._original = clonePlain(this.toObject());
    return this;
  }

  async updateOne(update = {}) {
    applyUpdatePayload(this, update);
    await this.save();
    return { modifiedCount: 1 };
  }

  async populate(path, select) {
    if (typeof path === 'string' && path.includes(' ') && select === undefined) {
      for (const item of path.split(/\s+/).filter(Boolean)) {
        await this.constructor.populateDocument(this, { path: item });
      }
      return this;
    }

    await this.constructor.populateDocument(this, typeof path === 'object' ? path : { path, select });
    return this;
  }

  isModified(field) {
    return serializeValue(this[field]) !== serializeValue(this._original[field]);
  }

  toObject(options = {}) {
    const plain = {};
    Object.keys(this).forEach((key) => {
      if (key.startsWith('_') && key !== '_id') return;
      plain[key] = options.keepIds ? this[key] : serializeValue(this[key]);
    });
    return plain;
  }

  toJSON() {
    return this.toObject();
  }
}

const matchesPlain = (doc, conditions = {}) => {
  const plain = doc.toObject ? doc.toObject({ keepIds: true }) : doc;

  return Object.entries(conditions).every(([field, expected]) => {
    const actual = plain[field];
    if (expected && typeof expected === 'object' && expected.$ne !== undefined) {
      return normalizeValue(actual)?.toString() !== normalizeValue(expected.$ne)?.toString();
    }
    return normalizeValue(actual)?.toString() === normalizeValue(expected)?.toString();
  });
};

module.exports = {
  BaseModel,
  IdValue,
  normalizeValue,
  toSqlDate,
  parseJson,
  applyUpdatePayload
};
