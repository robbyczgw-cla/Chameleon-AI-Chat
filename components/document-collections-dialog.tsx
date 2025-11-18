"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { documentCollectionService } from "@/lib/document-collections"
import { processFile } from "@/lib/file-handler"
import { generateDocumentEmbeddings } from "@/lib/semantic-search"
import { deleteEmbedding } from "@/lib/embeddings-store"
import { FolderOpen, Plus, Trash2, Upload, FileText } from "lucide-react"
import type { DocumentCollection } from "@/types"

interface DocumentCollectionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCollection?: (collectionId: string) => void
}

export function DocumentCollectionsDialog({ open, onOpenChange, onSelectCollection }: DocumentCollectionsDialogProps) {
  const [collections, setCollections] = useState(documentCollectionService.getAllCollections())
  const [selectedCollection, setSelectedCollection] = useState<DocumentCollection | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollection, setNewCollection] = useState({ name: "", description: "" })

  const handleCreateCollection = () => {
    if (!newCollection.name) return
    const collection = documentCollectionService.createCollection(newCollection.name, newCollection.description)
    setCollections(documentCollectionService.getAllCollections())
    setNewCollection({ name: "", description: "" })
    setShowCreateForm(false)
    setSelectedCollection(collection)
  }

  const handleDeleteCollection = async (id: string) => {
    if (confirm("Delete this collection and all its documents?")) {
      // Delete all embeddings for this collection
      try {
        const { deleteEmbeddingsByCollection } = await import("@/lib/embeddings-store")
        await deleteEmbeddingsByCollection(id)
        console.log(`[DocumentCollections] Deleted all embeddings for collection ${id}`)
      } catch (error) {
        console.error("[DocumentCollections] Failed to delete collection embeddings:", error)
      }

      documentCollectionService.deleteCollection(id)
      setCollections(documentCollectionService.getAllCollections())
      if (selectedCollection?.id === id) {
        setSelectedCollection(null)
      }
    }
  }

  const handleAddDocument = async (collectionId: string, file: File) => {
    try {
      const processed = await processFile(file)
      const doc = documentCollectionService.addDocument(collectionId, {
        name: file.name,
        content: processed.content,
        type: file.type,
        size: file.size,
      })

      // Generate embeddings for the document automatically
      if (doc && processed.content) {
        console.log(`[DocumentCollections] Generating embeddings for ${file.name}`)
        try {
          await generateDocumentEmbeddings(doc.id, processed.content, {
            collectionId,
            documentName: file.name,
          })
          console.log(`[DocumentCollections] Embeddings generated successfully`)
        } catch (error) {
          console.error("[DocumentCollections] Failed to generate embeddings:", error)
          // Don't fail the upload if embeddings fail
        }
      }

      setCollections(documentCollectionService.getAllCollections())
      const updated = documentCollectionService.getCollection(collectionId)
      if (updated) setSelectedCollection(updated)
    } catch (error) {
      console.error("[DocumentCollections] Failed to process file:", error)
      alert("Failed to process file")
    }
  }

  const handleRemoveDocument = async (collectionId: string, documentId: string) => {
    // Delete embeddings for this document
    try {
      await deleteEmbedding(documentId)
      // Also delete chunked embeddings if they exist
      const allEmbeddings = await import("@/lib/embeddings-store").then(m => m.getAllEmbeddings())
      const chunkEmbeddings = allEmbeddings.filter(e => e.id.startsWith(`${documentId}-chunk-`))
      for (const chunk of chunkEmbeddings) {
        await deleteEmbedding(chunk.id)
      }
      console.log(`[DocumentCollections] Deleted embeddings for document ${documentId}`)
    } catch (error) {
      console.error("[DocumentCollections] Failed to delete embeddings:", error)
    }

    documentCollectionService.removeDocument(collectionId, documentId)
    setCollections(documentCollectionService.getAllCollections())
    const updated = documentCollectionService.getCollection(collectionId)
    if (updated) setSelectedCollection(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Document Collections</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Collections</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showCreateForm && (
              <div className="space-y-2 rounded-lg border p-3">
                <Input
                  placeholder="Collection name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  rows={2}
                />
                <Button size="sm" onClick={handleCreateCollection} disabled={!newCollection.name}>
                  Create
                </Button>
              </div>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-muted ${
                      selectedCollection?.id === collection.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">{collection.name}</div>
                        <div className="text-xs text-muted-foreground">{collection.documents.length} documents</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCollection(collection.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="col-span-2 space-y-2">
            {selectedCollection ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedCollection.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCollection.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files) {
                            Array.from(files).forEach((file) => handleAddDocument(selectedCollection.id, file))
                          }
                        }
                        input.click()
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add Documents
                    </Button>
                    {onSelectCollection && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSelectCollection(selectedCollection.id)
                          onOpenChange(false)
                        }}
                      >
                        Use in Chat
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedCollection.documents.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between rounded-lg border p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-1 h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.addedAt).toLocaleDateString()}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{doc.content}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveDocument(selectedCollection.id, doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Select a collection to view documents
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
