Foundation Models Text Generation API: REST reference
Статья создана

Yandex Cloud
Обновлена 24 апреля 2025 г.
The service does not operate with resources.

Interface definitions available at GitHub.

Service URL: https://llm.api.cloud.yandex.net

Service

Description

Operation

A set of methods for managing operations for asynchronous API requests.

TextGenerationAsync

Service for asynchronous text generation.

TextGenerationBatch

Service for text generation.

TextGeneration

Service for text generation.

Tokenizer

Service for tokenizing input content.
Foundation Models Text Generation API, REST: Operation.Get
Статья создана

Yandex Cloud
Обновлена 8 августа 2025 г.
Returns the specified Operation resource.

HTTP request
GET https://operation.api.cloud.yandex.net/operations/{operationId}

Path parameters
Field

Description

operationId

string

Required field. ID of the Operation resource to return.

Response
HTTP Code: 200 - OK

{
  "id": "string",
  "description": "string",
  "createdAt": "string",
  "createdBy": "string",
  "modifiedAt": "string",
  "done": "boolean",
  "metadata": "object",
  // Includes only one of the fields `error`, `response`
  "error": {
    "code": "integer",
    "message": "string",
    "details": [
      "object"
    ]
  },
  "response": "object"
  // end of the list of possible fields
}

An Operation resource. For more information, see Operation.

Field

Description

id

string

ID of the operation.

description

string

Description of the operation. 0-256 characters long.

createdAt

string (date-time)

Creation timestamp.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

createdBy

string

ID of the user or service account who initiated the operation.

modifiedAt

string (date-time)

The time when the Operation resource was last modified.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

done

boolean

If the value is false, it means the operation is still in progress.
If true, the operation is completed, and either error or response is available.

metadata

object

Service-specific metadata associated with the operation.
It typically contains the ID of the target resource that the operation is performed on.
Any method that returns a long-running operation should document the metadata type, if any.

error

Status

The error result of the operation in case of failure or cancellation.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

response

object

The normal response of the operation in case of success.
If the original method returns no data on success, such as Delete,
the response is google.protobuf.Empty.
If the original method is the standard Create/Update,
the response should be the target resource of the operation.
Any method that returns a long-running operation should document the response type, if any.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

Status
The error result of the operation in case of failure or cancellation.

Field

Description

code

integer (int32)

Error code. An enum value of google.rpc.Code.

message

string

An error message.

details[]

object

A list of messages that carry the error details.

Foundation Models Text Generation API, REST: Operation.Cancel
Статья создана

Yandex Cloud
Обновлена 8 августа 2025 г.
Cancels the specified operation.

Note that currently Object Storage API does not support cancelling operations.

HTTP request
GET https://operation.api.cloud.yandex.net/operations/{operationId}:cancel

Path parameters
Field

Description

operationId

string

Required field. ID of the operation to cancel.

Response
HTTP Code: 200 - OK

{
  "id": "string",
  "description": "string",
  "createdAt": "string",
  "createdBy": "string",
  "modifiedAt": "string",
  "done": "boolean",
  "metadata": "object",
  // Includes only one of the fields `error`, `response`
  "error": {
    "code": "integer",
    "message": "string",
    "details": [
      "object"
    ]
  },
  "response": "object"
  // end of the list of possible fields
}

An Operation resource. For more information, see Operation.

Field

Description

id

string

ID of the operation.

description

string

Description of the operation. 0-256 characters long.

createdAt

string (date-time)

Creation timestamp.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

createdBy

string

ID of the user or service account who initiated the operation.

modifiedAt

string (date-time)

The time when the Operation resource was last modified.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

done

boolean

If the value is false, it means the operation is still in progress.
If true, the operation is completed, and either error or response is available.

metadata

object

Service-specific metadata associated with the operation.
It typically contains the ID of the target resource that the operation is performed on.
Any method that returns a long-running operation should document the metadata type, if any.

error

Status

The error result of the operation in case of failure or cancellation.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

response

object

The normal response of the operation in case of success.
If the original method returns no data on success, such as Delete,
the response is google.protobuf.Empty.
If the original method is the standard Create/Update,
the response should be the target resource of the operation.
Any method that returns a long-running operation should document the response type, if any.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

Status
The error result of the operation in case of failure or cancellation.

Field

Description

code

integer (int32)

Error code. An enum value of google.rpc.Code.

message

string

An error message.

details[]

object

A list of messages that carry the error details.

Foundation Models Text Generation API, REST: TextGenerationAsync
Статья создана

Yandex Cloud
Обновлена 17 октября 2024 г.
Service for asynchronous text generation.

Methods
Method

Description

Completion

A method for generating text completions in asynchronous mode.

Foundation Models Text Generation API, REST: TextGenerationAsync.Completion
Статья создана

Yandex Cloud
Обновлена 30 октября 2025 г.
A method for generating text completions in asynchronous mode.

HTTP request
POST https://llm.api.cloud.yandex.net/foundationModels/v1/completionAsync

Body parameters
{
  "modelUri": "string",
  "completionOptions": {
    "stream": "boolean",
    "temperature": "number",
    "maxTokens": "string",
    "reasoningOptions": {
      "mode": "string"
    }
  },
  "messages": [
    {
      "role": "string",
      // Includes only one of the fields `text`, `toolCallList`, `toolResultList`
      "text": "string",
      "toolCallList": {
        "toolCalls": [
          {
            // Includes only one of the fields `functionCall`
            "functionCall": {
              "name": "string",
              "arguments": "object"
            }
            // end of the list of possible fields
          }
        ]
      },
      "toolResultList": {
        "toolResults": [
          {
            // Includes only one of the fields `functionResult`
            "functionResult": {
              "name": "string",
              // Includes only one of the fields `content`
              "content": "string"
              // end of the list of possible fields
            }
            // end of the list of possible fields
          }
        ]
      }
      // end of the list of possible fields
    }
  ],
  "tools": [
    {
      // Includes only one of the fields `function`
      "function": {
        "name": "string",
        "description": "string",
        "parameters": "object",
        "strict": "boolean"
      }
      // end of the list of possible fields
    }
  ],
  // Includes only one of the fields `jsonObject`, `jsonSchema`
  "jsonObject": "boolean",
  "jsonSchema": {
    "schema": "object"
  },
  // end of the list of possible fields
  "parallelToolCalls": "boolean",
  "toolChoice": {
    // Includes only one of the fields `mode`, `functionName`
    "mode": "string",
    "functionName": "string"
    // end of the list of possible fields
  }
}

Request for the service to generate text completion.

Field

Description

modelUri

string

The ID of the model to be used for completion generation.

completionOptions

CompletionOptions

Configuration options for completion generation.

messages[]

Message

A list of messages representing the context for the completion model.

tools[]

Tool

List of tools that are available for the model to invoke during the completion generation.
Note: This parameter is not yet supported and will be ignored if provided.

jsonObject

boolean

When set to true, the model will respond with a valid JSON object.
Be sure to explicitly ask the model for JSON.
Otherwise, it may generate excessive whitespace and run indefinitely until it reaches the token limit.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

jsonSchema

JsonSchema

Enforces a specific JSON structure for the model's response based on a provided schema.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

parallelToolCalls

boolean

Controls whether the model can generate multiple tool calls in a single response. Defaults to true.

toolChoice

ToolChoice

Specifies how the model should select which tool (or tools) to use when generating a response.

CompletionOptions
Defines the options for completion generation.

Field

Description

stream

boolean

Enables streaming of partially generated text.

temperature

number (double)

Affects creativity and randomness of responses. Should be a double number between 0 (inclusive) and 1 (inclusive).
Lower values produce more straightforward responses while higher values lead to increased creativity and randomness.
Default temperature: 0.3

maxTokens

string (int64)

The limit on the number of tokens used for single completion generation.
Must be greater than zero. This maximum allowed parameter value may depend on the model being used.

reasoningOptions

ReasoningOptions

Configures reasoning capabilities for the model, allowing it to perform internal reasoning before responding.

ReasoningOptions
Represents reasoning options that enable the model's ability to perform internal reasoning before generating a response.

Field

Description

mode

enum (ReasoningMode)

Specifies the reasoning mode to be used.

REASONING_MODE_UNSPECIFIED: Unspecified reasoning mode.
DISABLED: Disables reasoning. The model will generate a response without performing any internal reasoning.
ENABLED_HIDDEN: Enables reasoning in a hidden manner without exposing the reasoning steps to the user.
Message
A message object representing a wrapper over the inputs and outputs of the completion model.

Field

Description

role

string

The ID of the message sender. Supported roles:

system: Special role used to define the behavior of the completion model.
assistant: A role used by the model to generate responses.
user: A role used by the user to describe requests to the model.
text

string

Textual content of the message.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolCallList

ToolCallList

List of tool calls made by the model as part of the response generation.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolResultList

ToolResultList

List of tool results returned from external tools that were invoked by the model.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

ToolCallList
Represents a list of tool calls.

Field

Description

toolCalls[]

ToolCall

A list of tool calls to be executed.

ToolCall
Represents a call to a tool.

Field

Description

functionCall

FunctionCall

Represents a call to a function.

Includes only one of the fields functionCall.

FunctionCall
Represents the invocation of a function with specific arguments.

Field

Description

name

string

The name of the function being called.

arguments

object

The structured arguments passed to the function.
These arguments must adhere to the JSON Schema defined in the corresponding function's parameters.

ToolResultList
Represents a list of tool results.

Field

Description

toolResults[]

ToolResult

A list of tool results.

ToolResult
Represents the result of a tool call.

Field

Description

functionResult

FunctionResult

Represents the result of a function call.

Includes only one of the fields functionResult.

FunctionResult
Represents the result of a function call.

Field

Description

name

string

The name of the function that was executed.

content

string

The result of the function call, represented as a string.
This field can be used to store the output of the function.

Includes only one of the fields content.

Tool
Represents a tool that can be invoked during completion generation.

Field

Description

function

FunctionTool

Represents a function that can be called.

Includes only one of the fields function.

FunctionTool
Represents a function tool that can be invoked during completion generation.

Field

Description

name

string

The name of the function.

description

string

A description of the function's purpose or behavior.

parameters

object

A JSON Schema that defines the expected parameters for the function.
The schema should describe the required fields, their types, and any constraints or default values.

strict

boolean

Enforces strict adherence to the function schema, ensuring only defined parameters are used.

JsonSchema
Represents the expected structure of the model's response using a JSON Schema.

Field

Description

schema

object

The JSON Schema that the model's output must conform to.

ToolChoice
Specifies how the model should select which tool (or tools) to use when generating a response.

Field

Description

mode

enum (ToolChoiceMode)

Specifies the overall tool-calling mode.

Includes only one of the fields mode, functionName.

TOOL_CHOICE_MODE_UNSPECIFIED: The server will choose the default behavior, which is AUTO.
NONE: The model will not call any tool and will generate a standard text response.
AUTO: The model can choose between generating a text response or calling one or more tools.
This is the default behavior.
REQUIRED: The model is required to call one or more tools.
functionName

string

Forces the model to call a specific function.
The provided string must match the name of a function in the API request.

Includes only one of the fields mode, functionName.

Response
HTTP Code: 200 - OK

{
  "id": "string",
  "description": "string",
  "createdAt": "string",
  "createdBy": "string",
  "modifiedAt": "string",
  "done": "boolean",
  "metadata": "object",
  // Includes only one of the fields `error`, `response`
  "error": {
    "code": "integer",
    "message": "string",
    "details": [
      "object"
    ]
  },
  "response": {
    "alternatives": [
      {
        "message": {
          "role": "string",
          // Includes only one of the fields `text`, `toolCallList`, `toolResultList`
          "text": "string",
          "toolCallList": {
            "toolCalls": [
              {
                // Includes only one of the fields `functionCall`
                "functionCall": {
                  "name": "string",
                  "arguments": "object"
                }
                // end of the list of possible fields
              }
            ]
          },
          "toolResultList": {
            "toolResults": [
              {
                // Includes only one of the fields `functionResult`
                "functionResult": {
                  "name": "string",
                  // Includes only one of the fields `content`
                  "content": "string"
                  // end of the list of possible fields
                }
                // end of the list of possible fields
              }
            ]
          }
          // end of the list of possible fields
        },
        "status": "string"
      }
    ],
    "usage": {
      "inputTextTokens": "string",
      "completionTokens": "string",
      "totalTokens": "string",
      "completionTokensDetails": {
        "reasoningTokens": "string"
      }
    },
    "modelVersion": "string"
  }
  // end of the list of possible fields
}

An Operation resource. For more information, see Operation.

Field

Description

id

string

ID of the operation.

description

string

Description of the operation. 0-256 characters long.

createdAt

string (date-time)

Creation timestamp.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

createdBy

string

ID of the user or service account who initiated the operation.

modifiedAt

string (date-time)

The time when the Operation resource was last modified.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

done

boolean

If the value is false, it means the operation is still in progress.
If true, the operation is completed, and either error or response is available.

metadata

object

Service-specific metadata associated with the operation.
It typically contains the ID of the target resource that the operation is performed on.
Any method that returns a long-running operation should document the metadata type, if any.

error

Status

The error result of the operation in case of failure or cancellation.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

response

CompletionResponse

The normal response of the operation in case of success.
If the original method returns no data on success, such as Delete,
the response is google.protobuf.Empty.
If the original method is the standard Create/Update,
the response should be the target resource of the operation.
Any method that returns a long-running operation should document the response type, if any.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

Status
The error result of the operation in case of failure or cancellation.

Field

Description

code

integer (int32)

Error code. An enum value of google.rpc.Code.

message

string

An error message.

details[]

object

A list of messages that carry the error details.

CompletionResponse
Response containing generated text completions.

Field

Description

alternatives[]

Alternative

A list of generated completion alternatives.

usage

ContentUsage

A set of statistics describing the number of content tokens used by the completion model.

modelVersion

string

The model version changes with each new releases.

Alternative
Represents a generated completion alternative, including its content and generation status.

Field

Description

message

Message

A message with the content of the alternative.

status

enum (AlternativeStatus)

The generation status of the alternative.

ALTERNATIVE_STATUS_UNSPECIFIED: Unspecified generation status.
ALTERNATIVE_STATUS_PARTIAL: Partially generated alternative.
ALTERNATIVE_STATUS_TRUNCATED_FINAL: Incomplete final alternative resulting from reaching the maximum allowed number of tokens.
ALTERNATIVE_STATUS_FINAL: Final alternative generated without running into any limits.
ALTERNATIVE_STATUS_CONTENT_FILTER: Generation was stopped due to the discovery of potentially sensitive content in the prompt or generated response.
To fix, modify the prompt and restart generation.
ALTERNATIVE_STATUS_TOOL_CALLS: Tools were invoked during the completion generation.
Message
A message object representing a wrapper over the inputs and outputs of the completion model.

Field

Description

role

string

The ID of the message sender. Supported roles:

system: Special role used to define the behavior of the completion model.
assistant: A role used by the model to generate responses.
user: A role used by the user to describe requests to the model.
text

string

Textual content of the message.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolCallList

ToolCallList

List of tool calls made by the model as part of the response generation.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolResultList

ToolResultList

List of tool results returned from external tools that were invoked by the model.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

ToolCallList
Represents a list of tool calls.

Field

Description

toolCalls[]

ToolCall

A list of tool calls to be executed.

ToolCall
Represents a call to a tool.

Field

Description

functionCall

FunctionCall

Represents a call to a function.

Includes only one of the fields functionCall.

FunctionCall
Represents the invocation of a function with specific arguments.

Field

Description

name

string

The name of the function being called.

arguments

object

The structured arguments passed to the function.
These arguments must adhere to the JSON Schema defined in the corresponding function's parameters.

ToolResultList
Represents a list of tool results.

Field

Description

toolResults[]

ToolResult

A list of tool results.

ToolResult
Represents the result of a tool call.

Field

Description

functionResult

FunctionResult

Represents the result of a function call.

Includes only one of the fields functionResult.

FunctionResult
Represents the result of a function call.

Field

Description

name

string

The name of the function that was executed.

content

string

The result of the function call, represented as a string.
This field can be used to store the output of the function.

Includes only one of the fields content.

ContentUsage
An object representing the number of content tokens used by the completion model.

Field

Description

inputTextTokens

string (int64)

The number of tokens in the textual part of the model input.

completionTokens

string (int64)

The number of tokens in the generated completion.

totalTokens

string (int64)

The total number of tokens, including all input tokens and all generated tokens.

completionTokensDetails

CompletionTokensDetails

Provides additional information about how the completion tokens were utilized.

CompletionTokensDetails
Provides additional information about how the completion tokens were utilized.

Field

Description

reasoningTokens

string (int64)

The number of tokens used specifically for internal reasoning performed by the model.

Foundation Models Text Generation API, REST: TextGenerationBatch.Completion
Статья создана

Yandex Cloud
Обновлена 30 октября 2025 г.
A method for generating text completions in synchronous mode.
Note: Not implemented yet

HTTP request
POST https://llm.api.cloud.yandex.net/foundationModels/v1/completionBatch

Body parameters
{
  "modelUri": "string",
  "completionOptions": {
    "stream": "boolean",
    "temperature": "number",
    "maxTokens": "string",
    "reasoningOptions": {
      "mode": "string"
    }
  },
  // Includes only one of the fields `sourceDatasetId`
  "sourceDatasetId": "string",
  // end of the list of possible fields
  // Includes only one of the fields `jsonObject`, `jsonSchema`
  "jsonObject": "boolean",
  "jsonSchema": {
    "schema": "object"
  }
  // end of the list of possible fields
}

Request for the service to generate batch text completion.

Field

Description

modelUri

string

The ID of the model to be used for batch completion generation.

completionOptions

CompletionOptions

Configuration options for completion generation.

sourceDatasetId

string

ID of the dataset containing the context for the completion model.

Includes only one of the fields sourceDatasetId.

Specifies the format of the request.

jsonObject

boolean

When set to true, the model will respond with a valid JSON object.
Be sure to explicitly ask the model for JSON.
Otherwise, it may generate excessive whitespace and run indefinitely until it reaches the token limit.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

jsonSchema

JsonSchema

Enforces a specific JSON structure for the model's response based on a provided schema.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

CompletionOptions
Defines the options for completion generation.

Field

Description

stream

boolean

Enables streaming of partially generated text.

temperature

number (double)

Affects creativity and randomness of responses. Should be a double number between 0 (inclusive) and 1 (inclusive).
Lower values produce more straightforward responses while higher values lead to increased creativity and randomness.
Default temperature: 0.3

maxTokens

string (int64)

The limit on the number of tokens used for single completion generation.
Must be greater than zero. This maximum allowed parameter value may depend on the model being used.

reasoningOptions

ReasoningOptions

Configures reasoning capabilities for the model, allowing it to perform internal reasoning before responding.

ReasoningOptions
Represents reasoning options that enable the model's ability to perform internal reasoning before generating a response.

Field

Description

mode

enum (ReasoningMode)

Specifies the reasoning mode to be used.

REASONING_MODE_UNSPECIFIED: Unspecified reasoning mode.
DISABLED: Disables reasoning. The model will generate a response without performing any internal reasoning.
ENABLED_HIDDEN: Enables reasoning in a hidden manner without exposing the reasoning steps to the user.
JsonSchema
Represents the expected structure of the model's response using a JSON Schema.

Field

Description

schema

object

The JSON Schema that the model's output must conform to.

Response
HTTP Code: 200 - OK

{
  "id": "string",
  "description": "string",
  "createdAt": "string",
  "createdBy": "string",
  "modifiedAt": "string",
  "done": "boolean",
  "metadata": {
    "taskId": "string",
    "taskStatus": "string",
    "completedBatches": "string",
    "totalBatches": "string"
  },
  // Includes only one of the fields `error`, `response`
  "error": {
    "code": "integer",
    "message": "string",
    "details": [
      "object"
    ]
  },
  "response": {
    "taskId": "string",
    "taskStatus": "string",
    "resultDatasetId": "string"
  }
  // end of the list of possible fields
}

An Operation resource. For more information, see Operation.

Field

Description

id

string

ID of the operation.

description

string

Description of the operation. 0-256 characters long.

createdAt

string (date-time)

Creation timestamp.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

createdBy

string

ID of the user or service account who initiated the operation.

modifiedAt

string (date-time)

The time when the Operation resource was last modified.

String in RFC3339 text format. The range of possible values is from
0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z, i.e. from 0 to 9 digits for fractions of a second.

To work with values in this field, use the APIs described in the
Protocol Buffers reference.
In some languages, built-in datetime utilities do not support nanosecond precision (9 digits).

done

boolean

If the value is false, it means the operation is still in progress.
If true, the operation is completed, and either error or response is available.

metadata

BatchCompletionMetadata

Service-specific metadata associated with the operation.
It typically contains the ID of the target resource that the operation is performed on.
Any method that returns a long-running operation should document the metadata type, if any.

error

Status

The error result of the operation in case of failure or cancellation.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

response

BatchCompletionResponse

The normal response of the operation in case of success.
If the original method returns no data on success, such as Delete,
the response is google.protobuf.Empty.
If the original method is the standard Create/Update,
the response should be the target resource of the operation.
Any method that returns a long-running operation should document the response type, if any.

Includes only one of the fields error, response.

The operation result.
If done == false and there was no failure detected, neither error nor response is set.
If done == false and there was a failure detected, error is set.
If done == true, exactly one of error or response is set.

BatchCompletionMetadata
Metadata of the batch completion operation.

Field

Description

taskId

string

The ID of the batch completion task.

taskStatus

enum (BatchInferenceTaskStatus)

The status of the batch completion task.

BATCH_INFERENCE_TASK_STATUS_UNSPECIFIED
CREATED
PENDING
IN_PROGRESS
COMPLETED
FAILED
CANCELED
completedBatches

string (int64)

A number of currently completed batches of the completion task.

totalBatches

string (int64)

A number of total batches of the completion task.

Status
The error result of the operation in case of failure or cancellation.

Field

Description

code

integer (int32)

Error code. An enum value of google.rpc.Code.

message

string

An error message.

details[]

object

A list of messages that carry the error details.

BatchCompletionResponse
Response containing information about completion task.

Field

Description

taskId

string

The ID of the batch completion task.

taskStatus

enum (BatchInferenceTaskStatus)

The status of the batch completion task.

BATCH_INFERENCE_TASK_STATUS_UNSPECIFIED
CREATED
PENDING
IN_PROGRESS
COMPLETED
FAILED
CANCELED
resultDatasetId

string

The ID of the dataset containing completion results.

Foundation Models Text Generation API, REST: TextGeneration.Completion
Статья создана

Yandex Cloud
Обновлена 30 октября 2025 г.
A method for generating text completions in synchronous mode.

HTTP request
POST https://llm.api.cloud.yandex.net/foundationModels/v1/completion

Body parameters
{
  "modelUri": "string",
  "completionOptions": {
    "stream": "boolean",
    "temperature": "number",
    "maxTokens": "string",
    "reasoningOptions": {
      "mode": "string"
    }
  },
  "messages": [
    {
      "role": "string",
      // Includes only one of the fields `text`, `toolCallList`, `toolResultList`
      "text": "string",
      "toolCallList": {
        "toolCalls": [
          {
            // Includes only one of the fields `functionCall`
            "functionCall": {
              "name": "string",
              "arguments": "object"
            }
            // end of the list of possible fields
          }
        ]
      },
      "toolResultList": {
        "toolResults": [
          {
            // Includes only one of the fields `functionResult`
            "functionResult": {
              "name": "string",
              // Includes only one of the fields `content`
              "content": "string"
              // end of the list of possible fields
            }
            // end of the list of possible fields
          }
        ]
      }
      // end of the list of possible fields
    }
  ],
  "tools": [
    {
      // Includes only one of the fields `function`
      "function": {
        "name": "string",
        "description": "string",
        "parameters": "object",
        "strict": "boolean"
      }
      // end of the list of possible fields
    }
  ],
  // Includes only one of the fields `jsonObject`, `jsonSchema`
  "jsonObject": "boolean",
  "jsonSchema": {
    "schema": "object"
  },
  // end of the list of possible fields
  "parallelToolCalls": "boolean",
  "toolChoice": {
    // Includes only one of the fields `mode`, `functionName`
    "mode": "string",
    "functionName": "string"
    // end of the list of possible fields
  }
}

Request for the service to generate text completion.

Field

Description

modelUri

string

The ID of the model to be used for completion generation.

completionOptions

CompletionOptions

Configuration options for completion generation.

messages[]

Message

A list of messages representing the context for the completion model.

tools[]

Tool

List of tools that are available for the model to invoke during the completion generation.
Note: This parameter is not yet supported and will be ignored if provided.

jsonObject

boolean

When set to true, the model will respond with a valid JSON object.
Be sure to explicitly ask the model for JSON.
Otherwise, it may generate excessive whitespace and run indefinitely until it reaches the token limit.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

jsonSchema

JsonSchema

Enforces a specific JSON structure for the model's response based on a provided schema.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

parallelToolCalls

boolean

Controls whether the model can generate multiple tool calls in a single response. Defaults to true.

toolChoice

ToolChoice

Specifies how the model should select which tool (or tools) to use when generating a response.

CompletionOptions
Defines the options for completion generation.

Field

Description

stream

boolean

Enables streaming of partially generated text.

temperature

number (double)

Affects creativity and randomness of responses. Should be a double number between 0 (inclusive) and 1 (inclusive).
Lower values produce more straightforward responses while higher values lead to increased creativity and randomness.
Default temperature: 0.3

maxTokens

string (int64)

The limit on the number of tokens used for single completion generation.
Must be greater than zero. This maximum allowed parameter value may depend on the model being used.

reasoningOptions

ReasoningOptions

Configures reasoning capabilities for the model, allowing it to perform internal reasoning before responding.

ReasoningOptions
Represents reasoning options that enable the model's ability to perform internal reasoning before generating a response.

Field

Description

mode

enum (ReasoningMode)

Specifies the reasoning mode to be used.

REASONING_MODE_UNSPECIFIED: Unspecified reasoning mode.
DISABLED: Disables reasoning. The model will generate a response without performing any internal reasoning.
ENABLED_HIDDEN: Enables reasoning in a hidden manner without exposing the reasoning steps to the user.
Message
A message object representing a wrapper over the inputs and outputs of the completion model.

Field

Description

role

string

The ID of the message sender. Supported roles:

system: Special role used to define the behavior of the completion model.
assistant: A role used by the model to generate responses.
user: A role used by the user to describe requests to the model.
text

string

Textual content of the message.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolCallList

ToolCallList

List of tool calls made by the model as part of the response generation.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolResultList

ToolResultList

List of tool results returned from external tools that were invoked by the model.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

ToolCallList
Represents a list of tool calls.

Field

Description

toolCalls[]

ToolCall

A list of tool calls to be executed.

ToolCall
Represents a call to a tool.

Field

Description

functionCall

FunctionCall

Represents a call to a function.

Includes only one of the fields functionCall.

FunctionCall
Represents the invocation of a function with specific arguments.

Field

Description

name

string

The name of the function being called.

arguments

object

The structured arguments passed to the function.
These arguments must adhere to the JSON Schema defined in the corresponding function's parameters.

ToolResultList
Represents a list of tool results.

Field

Description

toolResults[]

ToolResult

A list of tool results.

ToolResult
Represents the result of a tool call.

Field

Description

functionResult

FunctionResult

Represents the result of a function call.

Includes only one of the fields functionResult.

FunctionResult
Represents the result of a function call.

Field

Description

name

string

The name of the function that was executed.

content

string

The result of the function call, represented as a string.
This field can be used to store the output of the function.

Includes only one of the fields content.

Tool
Represents a tool that can be invoked during completion generation.

Field

Description

function

FunctionTool

Represents a function that can be called.

Includes only one of the fields function.

FunctionTool
Represents a function tool that can be invoked during completion generation.

Field

Description

name

string

The name of the function.

description

string

A description of the function's purpose or behavior.

parameters

object

A JSON Schema that defines the expected parameters for the function.
The schema should describe the required fields, their types, and any constraints or default values.

strict

boolean

Enforces strict adherence to the function schema, ensuring only defined parameters are used.

JsonSchema
Represents the expected structure of the model's response using a JSON Schema.

Field

Description

schema

object

The JSON Schema that the model's output must conform to.

ToolChoice
Specifies how the model should select which tool (or tools) to use when generating a response.

Field

Description

mode

enum (ToolChoiceMode)

Specifies the overall tool-calling mode.

Includes only one of the fields mode, functionName.

TOOL_CHOICE_MODE_UNSPECIFIED: The server will choose the default behavior, which is AUTO.
NONE: The model will not call any tool and will generate a standard text response.
AUTO: The model can choose between generating a text response or calling one or more tools.
This is the default behavior.
REQUIRED: The model is required to call one or more tools.
functionName

string

Forces the model to call a specific function.
The provided string must match the name of a function in the API request.

Includes only one of the fields mode, functionName.

Response
HTTP Code: 200 - OK

{
  "alternatives": [
    {
      "message": {
        "role": "string",
        // Includes only one of the fields `text`, `toolCallList`, `toolResultList`
        "text": "string",
        "toolCallList": {
          "toolCalls": [
            {
              // Includes only one of the fields `functionCall`
              "functionCall": {
                "name": "string",
                "arguments": "object"
              }
              // end of the list of possible fields
            }
          ]
        },
        "toolResultList": {
          "toolResults": [
            {
              // Includes only one of the fields `functionResult`
              "functionResult": {
                "name": "string",
                // Includes only one of the fields `content`
                "content": "string"
                // end of the list of possible fields
              }
              // end of the list of possible fields
            }
          ]
        }
        // end of the list of possible fields
      },
      "status": "string"
    }
  ],
  "usage": {
    "inputTextTokens": "string",
    "completionTokens": "string",
    "totalTokens": "string",
    "completionTokensDetails": {
      "reasoningTokens": "string"
    }
  },
  "modelVersion": "string"
}

Response containing generated text completions.

Field

Description

alternatives[]

Alternative

A list of generated completion alternatives.

usage

ContentUsage

A set of statistics describing the number of content tokens used by the completion model.

modelVersion

string

The model version changes with each new releases.

Alternative
Represents a generated completion alternative, including its content and generation status.

Field

Description

message

Message

A message with the content of the alternative.

status

enum (AlternativeStatus)

The generation status of the alternative.

ALTERNATIVE_STATUS_UNSPECIFIED: Unspecified generation status.
ALTERNATIVE_STATUS_PARTIAL: Partially generated alternative.
ALTERNATIVE_STATUS_TRUNCATED_FINAL: Incomplete final alternative resulting from reaching the maximum allowed number of tokens.
ALTERNATIVE_STATUS_FINAL: Final alternative generated without running into any limits.
ALTERNATIVE_STATUS_CONTENT_FILTER: Generation was stopped due to the discovery of potentially sensitive content in the prompt or generated response.
To fix, modify the prompt and restart generation.
ALTERNATIVE_STATUS_TOOL_CALLS: Tools were invoked during the completion generation.
Message
A message object representing a wrapper over the inputs and outputs of the completion model.

Field

Description

role

string

The ID of the message sender. Supported roles:

system: Special role used to define the behavior of the completion model.
assistant: A role used by the model to generate responses.
user: A role used by the user to describe requests to the model.
text

string

Textual content of the message.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolCallList

ToolCallList

List of tool calls made by the model as part of the response generation.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolResultList

ToolResultList

List of tool results returned from external tools that were invoked by the model.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

ToolCallList
Represents a list of tool calls.

Field

Description

toolCalls[]

ToolCall

A list of tool calls to be executed.

ToolCall
Represents a call to a tool.

Field

Description

functionCall

FunctionCall

Represents a call to a function.

Includes only one of the fields functionCall.

FunctionCall
Represents the invocation of a function with specific arguments.

Field

Description

name

string

The name of the function being called.

arguments

object

The structured arguments passed to the function.
These arguments must adhere to the JSON Schema defined in the corresponding function's parameters.

ToolResultList
Represents a list of tool results.

Field

Description

toolResults[]

ToolResult

A list of tool results.

ToolResult
Represents the result of a tool call.

Field

Description

functionResult

FunctionResult

Represents the result of a function call.

Includes only one of the fields functionResult.

FunctionResult
Represents the result of a function call.

Field

Description

name

string

The name of the function that was executed.

content

string

The result of the function call, represented as a string.
This field can be used to store the output of the function.

Includes only one of the fields content.

ContentUsage
An object representing the number of content tokens used by the completion model.

Field

Description

inputTextTokens

string (int64)

The number of tokens in the textual part of the model input.

completionTokens

string (int64)

The number of tokens in the generated completion.

totalTokens

string (int64)

The total number of tokens, including all input tokens and all generated tokens.

completionTokensDetails

CompletionTokensDetails

Provides additional information about how the completion tokens were utilized.

CompletionTokensDetails
Provides additional information about how the completion tokens were utilized.

Field

Description

reasoningTokens

string (int64)

The number of tokens used specifically for internal reasoning performed by the model.

Foundation Models Text Generation API, REST: Tokenizer.Tokenize
Статья создана

Yandex Cloud
Обновлена 8 августа 2025 г.
RPC method for tokenizing text.

HTTP request
POST https://llm.api.cloud.yandex.net/foundationModels/v1/tokenize

Body parameters
{
  "modelUri": "string",
  "text": "string"
}

Request for the service to tokenize input text.

Field

Description

modelUri

string

The identifier of the model to be used for tokenization.

text

string

Text to be tokenized.

Response
HTTP Code: 200 - OK

{
  "tokens": [
    {
      "id": "string",
      "text": "string",
      "special": "boolean"
    }
  ],
  "modelVersion": "string"
}

Response containing tokenized content from request.

Field

Description

tokens[]

Token

A list of tokens obtained from tokenization.

modelVersion

string

Model version (changes with model releases).

Token
Represents a token, the basic unit of content, used by the foundation model.

Field

Description

id

string (int64)

An internal token identifier.

text

string

The textual representation of the token.

special

boolean

Indicates whether the token is special or not. Special tokens may define the model's behavior and are not visible to users.

Foundation Models Text Generation API, REST: Tokenizer.TokenizeCompletion
Статья создана

Yandex Cloud
Обновлена 30 октября 2025 г.
RPC method for tokenizing content of CompletionRequest

HTTP request
POST https://llm.api.cloud.yandex.net/foundationModels/v1/tokenizeCompletion

Body parameters
{
  "modelUri": "string",
  "completionOptions": {
    "stream": "boolean",
    "temperature": "number",
    "maxTokens": "string",
    "reasoningOptions": {
      "mode": "string"
    }
  },
  "messages": [
    {
      "role": "string",
      // Includes only one of the fields `text`, `toolCallList`, `toolResultList`
      "text": "string",
      "toolCallList": {
        "toolCalls": [
          {
            // Includes only one of the fields `functionCall`
            "functionCall": {
              "name": "string",
              "arguments": "object"
            }
            // end of the list of possible fields
          }
        ]
      },
      "toolResultList": {
        "toolResults": [
          {
            // Includes only one of the fields `functionResult`
            "functionResult": {
              "name": "string",
              // Includes only one of the fields `content`
              "content": "string"
              // end of the list of possible fields
            }
            // end of the list of possible fields
          }
        ]
      }
      // end of the list of possible fields
    }
  ],
  "tools": [
    {
      // Includes only one of the fields `function`
      "function": {
        "name": "string",
        "description": "string",
        "parameters": "object",
        "strict": "boolean"
      }
      // end of the list of possible fields
    }
  ],
  // Includes only one of the fields `jsonObject`, `jsonSchema`
  "jsonObject": "boolean",
  "jsonSchema": {
    "schema": "object"
  },
  // end of the list of possible fields
  "parallelToolCalls": "boolean",
  "toolChoice": {
    // Includes only one of the fields `mode`, `functionName`
    "mode": "string",
    "functionName": "string"
    // end of the list of possible fields
  }
}

Request for the service to generate text completion.

Field

Description

modelUri

string

The ID of the model to be used for completion generation.

completionOptions

CompletionOptions

Configuration options for completion generation.

messages[]

Message

A list of messages representing the context for the completion model.

tools[]

Tool

List of tools that are available for the model to invoke during the completion generation.
Note: This parameter is not yet supported and will be ignored if provided.

jsonObject

boolean

When set to true, the model will respond with a valid JSON object.
Be sure to explicitly ask the model for JSON.
Otherwise, it may generate excessive whitespace and run indefinitely until it reaches the token limit.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

jsonSchema

JsonSchema

Enforces a specific JSON structure for the model's response based on a provided schema.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

parallelToolCalls

boolean

Controls whether the model can generate multiple tool calls in a single response. Defaults to true.

toolChoice

ToolChoice

Specifies how the model should select which tool (or tools) to use when generating a response.

CompletionOptions
Defines the options for completion generation.

Field

Description

stream

boolean

Enables streaming of partially generated text.

temperature

number (double)

Affects creativity and randomness of responses. Should be a double number between 0 (inclusive) and 1 (inclusive).
Lower values produce more straightforward responses while higher values lead to increased creativity and randomness.
Default temperature: 0.3

maxTokens

string (int64)

The limit on the number of tokens used for single completion generation.
Must be greater than zero. This maximum allowed parameter value may depend on the model being used.

reasoningOptions

ReasoningOptions

Configures reasoning capabilities for the model, allowing it to perform internal reasoning before responding.

ReasoningOptions
Represents reasoning options that enable the model's ability to perform internal reasoning before generating a response.

Field

Description

mode

enum (ReasoningMode)

Specifies the reasoning mode to be used.

REASONING_MODE_UNSPECIFIED: Unspecified reasoning mode.
DISABLED: Disables reasoning. The model will generate a response without performing any internal reasoning.
ENABLED_HIDDEN: Enables reasoning in a hidden manner without exposing the reasoning steps to the user.
Message
A message object representing a wrapper over the inputs and outputs of the completion model.

Field

Description

role

string

The ID of the message sender. Supported roles:

system: Special role used to define the behavior of the completion model.
assistant: A role used by the model to generate responses.
user: A role used by the user to describe requests to the model.
text

string

Textual content of the message.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolCallList

ToolCallList

List of tool calls made by the model as part of the response generation.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

toolResultList

ToolResultList

List of tool results returned from external tools that were invoked by the model.

Includes only one of the fields text, toolCallList, toolResultList.

Message content.

ToolCallList
Represents a list of tool calls.

Field

Description

toolCalls[]

ToolCall

A list of tool calls to be executed.

ToolCall
Represents a call to a tool.

Field

Description

functionCall

FunctionCall

Represents a call to a function.

Includes only one of the fields functionCall.

FunctionCall
Represents the invocation of a function with specific arguments.

Field

Description

name

string

The name of the function being called.

arguments

object

The structured arguments passed to the function.
These arguments must adhere to the JSON Schema defined in the corresponding function's parameters.

ToolResultList
Represents a list of tool results.

Field

Description

toolResults[]

ToolResult

A list of tool results.

ToolResult
Represents the result of a tool call.

Field

Description

functionResult

FunctionResult

Represents the result of a function call.

Includes only one of the fields functionResult.

FunctionResult
Represents the result of a function call.

Field

Description

name

string

The name of the function that was executed.

content

string

The result of the function call, represented as a string.
This field can be used to store the output of the function.

Includes only one of the fields content.

Tool
Represents a tool that can be invoked during completion generation.

Field

Description

function

FunctionTool

Represents a function that can be called.

Includes only one of the fields function.

FunctionTool
Represents a function tool that can be invoked during completion generation.

Field

Description

name

string

The name of the function.

description

string

A description of the function's purpose or behavior.

parameters

object

A JSON Schema that defines the expected parameters for the function.
The schema should describe the required fields, their types, and any constraints or default values.

strict

boolean

Enforces strict adherence to the function schema, ensuring only defined parameters are used.

JsonSchema
Represents the expected structure of the model's response using a JSON Schema.

Field

Description

schema

object

The JSON Schema that the model's output must conform to.

ToolChoice
Specifies how the model should select which tool (or tools) to use when generating a response.

Field

Description

mode

enum (ToolChoiceMode)

Specifies the overall tool-calling mode.

Includes only one of the fields mode, functionName.

TOOL_CHOICE_MODE_UNSPECIFIED: The server will choose the default behavior, which is AUTO.
NONE: The model will not call any tool and will generate a standard text response.
AUTO: The model can choose between generating a text response or calling one or more tools.
This is the default behavior.
REQUIRED: The model is required to call one or more tools.
functionName

string

Forces the model to call a specific function.
The provided string must match the name of a function in the API request.

Includes only one of the fields mode, functionName.

Response
HTTP Code: 200 - OK

{
  "tokens": [
    {
      "id": "string",
      "text": "string",
      "special": "boolean"
    }
  ],
  "modelVersion": "string"
}

Response containing tokenized content from request.

Field

Description

tokens[]

Token

A list of tokens obtained from tokenization.

modelVersion

string

Model version (changes with model releases).

Token
Represents a token, the basic unit of content, used by the foundation model.

Field

Description

id

string (int64)

An internal token identifier.

text

string

The textual representation of the token.

special

boolean

Indicates whether the token is special or not. Special tokens may define the model's behavior and are not visible to users.