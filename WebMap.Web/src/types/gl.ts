/**
 * Interface representing the definition of a vertex attribute in a WebGL program.
 * This defines the properties required to describe how a vertex attribute
 * is structured and accessed in a vertex buffer.
 *
 * @property {GLint} location - The location of the attribute in the shader program.
 * @property {number} size - The number of components per attribute (ranging from 1 to 4).
 * @property {GLenum} type - The data type of the attribute (e.g., gl.FLOAT, gl.UNSIGNED_BYTE).
 * @property {boolean} [normalized] - Optional flag indicating if fixed-point values should be normalized.
 */
export interface VertexAttribDef {
    location: GLint
    size: number
    type: GLenum
    normalized?: boolean
}

/**
 * Represents the attributes of a vertex in a graphics or computational pipeline.
 * This interface extends the VertexAttribDef and provides additional details
 * for vertex attribute properties, such as their offset and normalization status.
 *
 * Extends:
 * - VertexAttribDef: A base definition for vertex attributes.
 *
 * Properties:
 * @property {number} offset - Specifies the byte offset of this attribute within the vertex data.
 * @property {boolean} normalized - flag indicating if fixed-point values should be normalized
 *  when accessed in the shader program.
 */
export interface VertexAttrib extends VertexAttribDef {
    offset: number
    normalized: boolean
}
