class apiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludeFields = ['page', 'limit', 'sort', 'fields', 'search'];
    excludeFields.forEach((field) => delete queryStringObj[field]);
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    const queryStringObjParsed = JSON.parse(queryStr);
    this.mongooseQuery = this.mongooseQuery.find(queryStringObjParsed);
    return this;
  }

  // countDocuments is the total number of docs matching the *current* filter
  // (computed by the caller via Model.countDocuments(filter)). It's required to
  // compute the correct number of pages and the next/prev links.
  paginate(countDocuments = 0) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    const paginationResult = {};
    paginationResult.currentPage = page;
    paginationResult.limit = limit;
    paginationResult.numberOfPages = Math.ceil(countDocuments / limit);

    if (endIndex < countDocuments) {
      paginationResult.next = page + 1;
    }
    if (skip > 0 && page <= paginationResult.numberOfPages) {
      paginationResult.prev = page - 1;
    }

    this.paginationResult = paginationResult;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  // Generic keyword search. `searchFields` is the list of string fields to match
  // against (defaults to name/title/description); each caller passes the fields
  // relevant to its model.
  search(searchFields = ['name', 'title', 'description']) {
    if (this.queryString.search) {
      const keyword = this.queryString.search;
      const or = searchFields.map((field) => ({
        [field]: { $regex: keyword, $options: 'i' },
      }));
      this.mongooseQuery = this.mongooseQuery.find({ $or: or });
    }
    return this;
  }
}

module.exports = apiFeatures;
