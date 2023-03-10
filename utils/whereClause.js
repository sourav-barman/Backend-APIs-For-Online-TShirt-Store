//base - Product.find()

//bigQ - //search=coder&page=2&category=shortsleeves&rating[gte]=4
// &price[lte]=999&price[gte]=199&limit=5

class WhereClause {
    constructor(base, bigQ) {
        this.base = base;
        this.bigQ = bigQ;
    }

    search() {
        const searchWord = this.bigQ.search ? {
            name: {
                $regex: this.bigQ.search,
                $options: 'i'
            }
        } : {};

        this.base = this.base.find({...searchWord});

        return this;
    }

    filter() {
        const copyQ = {...this.bigQ};

        delete copyQ["search"];
        delete copyQ["limit"];
        delete copyQ["page"];

        //convert bigQ into a string => copyQ
        let stringOfCopyQ = JSON.stringify(copyQ);
        stringOfCopyQ = stringOfCopyQ.replace(/(gte|lte|gt|lt)/g, m => `$${m}`);

        const jsonOfCopyQ = JSON.parse(stringOfCopyQ);

        this.base = this.base.find(jsonOfCopyQ);

        return this;
    }

    pager(resultperPage) {
        let currentPage = 1;
        if (this.bigQ.page) {
            currentPage = this.bigQ.page;
        }

        const skipVal = resultperPage * (currentPage - 1);
        this.base = this.base.limit(resultperPage).skip(skipVal);

        return this;
    }
    
}

module.exports = WhereClause;