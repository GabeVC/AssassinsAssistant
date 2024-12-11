const { getFirestore } = require('firebase/firestore');

class Database{
    constructor() {
        this.db = getFirestore(); 
    }
    // Get a specific document's data (i.e. "games/gameId") without filtering
    async getDoc(collection, docId) {
        const docRef = this.db.collection(collection).doc(docId);
        const docSnapshot = await docRef.get();
        return docSnapshot.exists ? docSnapshot.data() : null;
    }

    // Adds the given data to the given collection in a new document
    // Returns the new document's id
    async addDoc(collection, data) {
        const docRef = await this.db.collection(collection).add(data);
        return docRef.id;
    }

    // Replace the information in the given document (specified by collection, docId)
    // with the given data.
    async updateDoc(collection, docId, data) {
        await this.db.collection(collection).doc(docId).set(data, { merge: true });
    }

    // Remove the given document from the firestore
    async deleteDoc(collection, docId) {
        await this.db.collection(collection).doc(docId).delete();
    }

    // Query for all documents in a collection that match
    // Conditions in conditions. conditions must be of format
    // {field, operator, value} (i.e. {"gameId", "==", gameId})
    // Returns a list [{doc.id, doc.data() },...]
    // Returns null if no documents match

    async queryDoc(collection, conditions) {
        let query = this.db.collection(collection);

        // Apply each condition in conditions
        for (const condition of conditions) {
            const {field, op, value} = condition;
            query = query.where(field, op, value);
        }

        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            return null;
        }

        return querySnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data()}));
    }
}

module.exports = new Database();