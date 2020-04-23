class CosmosDBDAO {
    /**
     * Manages reading, adding, and updating Tasks in Cosmos DB
     * @param {CosmosClient} cosmosClient
     * @param {string} databaseId
     * @param {string} containerId
     */
    constructor(cosmosClient, databaseId, containerId) {
      this.client = cosmosClient
      this.databaseId = databaseId
      this.collectionId = containerId
  
      this.database = null
      this.container = null
    }
  
    async init() {
      //console.log('Setting up the database...')
      const dbResponse = await this.client.databases.createIfNotExists({
        id: this.databaseId
      })
      this.database = dbResponse.database
      //console.log('Setting up the database...done!')
      //console.log('Setting up the container...')
      const coResponse = await this.database.containers.createIfNotExists({
        id: this.collectionId
      })
      this.container = coResponse.container
      //console.log('Setting up the container...done!')
    }
  
    async find(querySpec) {
      //console.log('Querying for items from the database')
      if (!this.container) {
        throw new Error('Collection is not initialized.')
      }
      const { resources } = await this.container.items.query(querySpec).fetchAll()
      return resources
    }
  
    async addItem(item) {
      //console.log('Adding an item to the database')
      item.date = Date.now()
      item.completed = false
      const { resource: doc } = await this.container.items.create(item)
      return doc
    }
  
    async updateItem(itemId,partitionKey) {
      //console.log('Update an item in the database')
      const doc = await this.getItem(itemId)
      doc.completed = true
  
      const { resource: replaced } = await this.container
        .item(itemId, partitionKey)
        .replace(doc)
      return replaced
    }
  
    async getItem(itemId,partitionKey) {
      //console.log('Getting an item from the database:' + itemId)
      const { resource } = await this.container.item(itemId, partitionKey).read()
      //console.log(resource)
      return resource
    }
  
    async removeItem(itemId) {
      //console.log('Removing an item from the database')
      await this.container.item(itemId, itemId).delete()
      //return resource
    }
  }
  
  module.exports=CosmosDBDAO;