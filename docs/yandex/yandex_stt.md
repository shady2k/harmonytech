SpeechKit Recognition API v3: REST reference
Статья создана

Yandex Cloud
Обновлена 3 октября 2025 г.
The SpeechKit Speech To Text Service API v3 allows application developers to use speech recognition technologies.
The service does not operate with resources. Actions are performed by making RPC calls. For more information about API architecture, see API Concepts.

Interface definitions available at GitHub.

Service URL: https://stt.api.cloud.yandex.net

Service

Description

AsyncRecognizer

A set of methods for asynchronous speech recognition: recognize pre-recorded audio and receive results by request.

Operation

A set of methods for managing operations for asynchronous API requests.

SpeechKit Recognition API v3, REST: AsyncRecognizer
Статья создана

Yandex Cloud
Обновлена 3 октября 2025 г.
A set of methods for asynchronous speech recognition: recognize pre-recorded audio and receive results by request.

Methods
Method

Description

RecognizeFile

Performs asynchronous speech recognition.

GetRecognition

Gets results of asynchronous recognition after finishing the operation.

DeleteRecognition

Deletes results of asynchronous recognition by operation ID.

SpeechKit Recognition API v3, REST: AsyncRecognizer.RecognizeFile
Статья создана

Yandex Cloud
Обновлена 30 октября 2025 г.
Performs asynchronous speech recognition.

HTTP request
POST https://stt.api.cloud.yandex.net/stt/v3/recognizeFileAsync

Body parameters
{
  // Includes only one of the fields `content`, `uri`
  "content": "string",
  "uri": "string",
  // end of the list of possible fields
  "recognitionModel": {
    "model": "string",
    "audioFormat": {
      // Includes only one of the fields `rawAudio`, `containerAudio`
      "rawAudio": {
        "audioEncoding": "string",
        "sampleRateHertz": "string",
        "audioChannelCount": "string"
      },
      "containerAudio": {
        "containerAudioType": "string"
      }
      // end of the list of possible fields
    },
    "textNormalization": {
      "textNormalization": "string",
      "profanityFilter": "boolean",
      "literatureText": "boolean",
      "phoneFormattingMode": "string"
    },
    "languageRestriction": {
      "restrictionType": "string",
      "languageCode": [
        "string"
      ]
    },
    "audioProcessingType": "string"
  },
  "recognitionClassifier": {
    "classifiers": [
      {
        "classifier": "string",
        "triggers": [
          "string"
        ]
      }
    ]
  },
  "speechAnalysis": {
    "enableSpeakerAnalysis": "boolean",
    "enableConversationAnalysis": "boolean",
    "descriptiveStatisticsQuantiles": [
      "string"
    ]
  },
  "speakerLabeling": {
    "speakerLabeling": "string"
  },
  "summarization": {
    "modelUri": "string",
    "properties": [
      {
        "instruction": "string",
        // Includes only one of the fields `jsonObject`, `jsonSchema`
        "jsonObject": "boolean",
        "jsonSchema": {
          "schema": "object"
        }
        // end of the list of possible fields
      }
    ]
  }
}

Field

Description

content

string (bytes)

Bytes with data

Includes only one of the fields content, uri.

uri

string

S3 data URL

Includes only one of the fields content, uri.

recognitionModel

RecognitionModelOptions

Configuration for speech recognition model.

recognitionClassifier

RecognitionClassifierOptions

Configuration for classifiers over speech recognition.

speechAnalysis

SpeechAnalysisOptions

Configuration for speech analysis over speech recognition.

speakerLabeling

SpeakerLabelingOptions

Configuration for speaker labeling

summarization

SummarizationOptions

Summarization options

RecognitionModelOptions
Field

Description

model

string

Sets the recognition model for the cloud version of SpeechKit.
For Recognizer.RecognizeStreaming, possible values are general, general:rc, general:deprecated.
For AsyncRecognizer.RecognizeFile, possible values are general, general:rc, general:deprecated, deferred-general, deferred-general:rc, and deferred-general:deprecated.
The model is ignored for SpeechKit Hybrid.

audioFormat

AudioFormatOptions

Specified input audio.

textNormalization

TextNormalizationOptions

Text normalization options.

languageRestriction

LanguageRestrictionOptions

Possible languages in audio.

audioProcessingType

enum (AudioProcessingType)

For Recognizer.RecognizeStreaming, defines the audio data processing mode. Default is REAL_TIME.
For AsyncRecognizer.RecognizeFile, this field is ignored.

AUDIO_PROCESSING_TYPE_UNSPECIFIED
REAL_TIME: Process audio in mode optimized for real-time recognition, i.e. send partials and final responses as soon as possible.
FULL_DATA: Process audio after all data was received.
AudioFormatOptions
Audio format options.

Field

Description

rawAudio

RawAudio

RAW audio without container.

Includes only one of the fields rawAudio, containerAudio.

containerAudio

ContainerAudio

Audio is wrapped in container.

Includes only one of the fields rawAudio, containerAudio.

RawAudio
RAW Audio format spec (no container to infer type). Used in AudioFormat options.

Field

Description

audioEncoding

enum (AudioEncoding)

Type of audio encoding.

AUDIO_ENCODING_UNSPECIFIED
LINEAR16_PCM: Audio bit depth 16-bit signed little-endian (Linear PCM).
sampleRateHertz

string (int64)

PCM sample rate.

audioChannelCount

string (int64)

PCM channel count. Currently only single channel audio is supported in real-time recognition.

ContainerAudio
Audio with fixed type in container. Used in AudioFormat options.

Field

Description

containerAudioType

enum (ContainerAudioType)

Type of audio container.

CONTAINER_AUDIO_TYPE_UNSPECIFIED
WAV: Audio bit depth 16-bit signed little-endian (Linear PCM).
OGG_OPUS: Data is encoded using the OPUS audio codec and compressed using the OGG container format.
MP3: Data is encoded using MPEG-1/2 Layer III and compressed using the MP3 container format.
TextNormalizationOptions
Options for post-processing text results. The normalization levels depend on the settings and the language.
For detailed information, see documentation.

Field

Description

textNormalization

enum (TextNormalization)

TEXT_NORMALIZATION_UNSPECIFIED
TEXT_NORMALIZATION_ENABLED: Enable converting numbers, dates and time from text to numeric format.
TEXT_NORMALIZATION_DISABLED: Disable all normalization. Default value.
profanityFilter

boolean

Profanity filter (default: false).

literatureText

boolean

Rewrite text in literature style (default: false).

phoneFormattingMode

enum (PhoneFormattingMode)

Define phone formatting mode

PHONE_FORMATTING_MODE_UNSPECIFIED
PHONE_FORMATTING_MODE_DISABLED: Disable phone formatting
LanguageRestrictionOptions
Type of restriction for the list of languages expected in the incoming audio.

Field

Description

restrictionType

enum (LanguageRestrictionType)

Language restriction type.
All of these restrictions are used by the model as guidelines, not as strict rules.
The language is recognized for each sentence. If a sentence has phrases in different languages, all of them will be transcribed in the most probable language.

LANGUAGE_RESTRICTION_TYPE_UNSPECIFIED
WHITELIST: The list of most possible languages in the incoming audio.
BLACKLIST: The list of languages that are likely not to be included in the incoming audio.
languageCode[]

string

The list of language codes to restrict recognition in the case of an auto model.

RecognitionClassifierOptions
Field

Description

classifiers[]

RecognitionClassifier

List of classifiers to use. For detailed information and usage example, see documentation.

RecognitionClassifier
Field

Description

classifier

string

Classifier name

triggers[]

enum (TriggerType)

Describes the types of responses to which the classification results will come. Classification responses will follow the responses of the specified types.

TRIGGER_TYPE_UNSPECIFIED
ON_UTTERANCE: Apply classifier to utterance responses.
ON_FINAL: Apply classifier to final responses.
ON_PARTIAL: Apply classifier to partial responses.
SpeechAnalysisOptions
Field

Description

enableSpeakerAnalysis

boolean

Analyse speech for every speaker

enableConversationAnalysis

boolean

Analyse conversation of two speakers

descriptiveStatisticsQuantiles[]

string

Quantile levels in range (0, 1) for descriptive statistics

SpeakerLabelingOptions
Field

Description

speakerLabeling

enum (SpeakerLabeling)

Specifies the execution of speaker labeling.

SPEAKER_LABELING_UNSPECIFIED
SPEAKER_LABELING_ENABLED: Enable speaker labeling.
SPEAKER_LABELING_DISABLED: Disable speaker labeling. Default value.
SummarizationOptions
Represents transcription summarization options.

Field

Description

modelUri

string

The ID of the model to be used for completion generation.

properties[]

SummarizationProperty

A list of suimmarizations to perform with transcription.

SummarizationProperty
Represents summarization entry for transcription.

Field

Description

instruction

string

Summarization instruction for model.

jsonObject

boolean

When set to true, the model will return a valid JSON object.
Be sure to ask the model explicitly for JSON.
Otherwise, it may produce excessive whitespace and run indefinitely until it reaches the token limit.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

jsonSchema

JsonSchema

Enforces a specific JSON structure for the model's response based on a provided schema.

Includes only one of the fields jsonObject, jsonSchema.

Specifies the format of the model's response.

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
  "metadata": "object",
  // Includes only one of the fields `error`
  "error": {
    "code": "integer",
    "message": "string",
    "details": [
      "object"
    ]
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

Includes only one of the fields error.

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

SpeechKit Recognition API v3, REST: AsyncRecognizer.GetRecognition
Статья создана

Yandex Cloud
Обновлена 3 октября 2025 г.
Gets results of asynchronous recognition after finishing the operation.

HTTP request
GET https://stt.api.cloud.yandex.net/stt/v3/getRecognition

Query parameters
Field

Description

operationId

string

Response
HTTP Code: 200 - OK

{
  "sessionUuid": {
    "uuid": "string",
    "userRequestId": "string"
  },
  "audioCursors": {
    "receivedDataMs": "string",
    "resetTimeMs": "string",
    "partialTimeMs": "string",
    "finalTimeMs": "string",
    "finalIndex": "string",
    "eouTimeMs": "string"
  },
  "responseWallTimeMs": "string",
  // Includes only one of the fields `partial`, `final`, `eouUpdate`, `finalRefinement`, `statusCode`, `classifierUpdate`, `speakerAnalysis`, `conversationAnalysis`, `summarization`
  "partial": {
    "alternatives": [
      {
        "words": [
          {
            "text": "string",
            "startTimeMs": "string",
            "endTimeMs": "string"
          }
        ],
        "text": "string",
        "startTimeMs": "string",
        "endTimeMs": "string",
        "confidence": "string",
        "languages": [
          {
            "languageCode": "string",
            "probability": "string"
          }
        ]
      }
    ],
    "channelTag": "string"
  },
  "final": {
    "alternatives": [
      {
        "words": [
          {
            "text": "string",
            "startTimeMs": "string",
            "endTimeMs": "string"
          }
        ],
        "text": "string",
        "startTimeMs": "string",
        "endTimeMs": "string",
        "confidence": "string",
        "languages": [
          {
            "languageCode": "string",
            "probability": "string"
          }
        ]
      }
    ],
    "channelTag": "string"
  },
  "eouUpdate": {
    "timeMs": "string"
  },
  "finalRefinement": {
    "finalIndex": "string",
    // Includes only one of the fields `normalizedText`
    "normalizedText": {
      "alternatives": [
        {
          "words": [
            {
              "text": "string",
              "startTimeMs": "string",
              "endTimeMs": "string"
            }
          ],
          "text": "string",
          "startTimeMs": "string",
          "endTimeMs": "string",
          "confidence": "string",
          "languages": [
            {
              "languageCode": "string",
              "probability": "string"
            }
          ]
        }
      ],
      "channelTag": "string"
    }
    // end of the list of possible fields
  },
  "statusCode": {
    "codeType": "string",
    "message": "string"
  },
  "classifierUpdate": {
    "windowType": "string",
    "startTimeMs": "string",
    "endTimeMs": "string",
    "classifierResult": {
      "classifier": "string",
      "highlights": [
        {
          "text": "string",
          "startTimeMs": "string",
          "endTimeMs": "string"
        }
      ],
      "labels": [
        {
          "label": "string",
          "confidence": "string"
        }
      ]
    }
  },
  "speakerAnalysis": {
    "speakerTag": "string",
    "windowType": "string",
    "speechBoundaries": {
      "startTimeMs": "string",
      "endTimeMs": "string"
    },
    "totalSpeechMs": "string",
    "speechRatio": "string",
    "totalSilenceMs": "string",
    "silenceRatio": "string",
    "wordsCount": "string",
    "lettersCount": "string",
    "wordsPerSecond": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "lettersPerSecond": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "wordsPerUtterance": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "lettersPerUtterance": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "utteranceCount": "string",
    "utteranceDurationEstimation": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    }
  },
  "conversationAnalysis": {
    "conversationBoundaries": {
      "startTimeMs": "string",
      "endTimeMs": "string"
    },
    "totalSimultaneousSilenceDurationMs": "string",
    "totalSimultaneousSilenceRatio": "string",
    "simultaneousSilenceDurationEstimation": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "totalSimultaneousSpeechDurationMs": "string",
    "totalSimultaneousSpeechRatio": "string",
    "simultaneousSpeechDurationEstimation": {
      "min": "string",
      "max": "string",
      "mean": "string",
      "std": "string",
      "quantiles": [
        {
          "level": "string",
          "value": "string"
        }
      ]
    },
    "speakerInterrupts": [
      {
        "speakerTag": "string",
        "interruptsCount": "string",
        "interruptsDurationMs": "string",
        "interrupts": [
          {
            "startTimeMs": "string",
            "endTimeMs": "string"
          }
        ]
      }
    ],
    "totalSpeechDurationMs": "string",
    "totalSpeechRatio": "string"
  },
  "summarization": {
    "results": [
      {
        "response": "string"
      }
    ],
    "contentUsage": {
      "inputTextTokens": "string",
      "completionTokens": "string",
      "totalTokens": "string"
    }
  },
  // end of the list of possible fields
  "channelTag": "string"
}

Responses from server.
Each response contains session UUID, AudioCursors, and specific event.

Field

Description

sessionUuid

SessionUuid

Session identifier.

audioCursors

AudioCursors

Progress bar for stream session recognition: how many data we obtained; final and partial times; etc.

responseWallTimeMs

string (int64)

Wall clock on server side. This is time when server wrote results to stream.

partial

AlternativeUpdate

Partial results, server will send them regularly after enough audio data was received from user.
This is the current text estimation from final_time_ms to partial_time_ms. Could change after new data will arrive.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

final

AlternativeUpdate

Final results, the recognition is now fixed until final_time_ms. For now, final is sent only if the EOU event was triggered. This behavior could be changed in future releases.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

eouUpdate

EouUpdate

After EOU classifier, send the message with final, send the EouUpdate with time of EOU
before eou_update we send final with the same time. there could be several finals before eou update.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

finalRefinement

FinalRefinement

For each final, if normalization is enabled, sent the normalized text (or some other advanced post-processing).
Final normalization will introduce additional latency.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

statusCode

StatusCode

Status messages, send by server with fixed interval (keep-alive).

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

classifierUpdate

RecognitionClassifierUpdate

Result of the triggered classifier.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

speakerAnalysis

SpeakerAnalysis

Speech statistics for every speaker.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

conversationAnalysis

ConversationAnalysis

Conversation statistics.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

summarization

Summarization

Summary.

Includes only one of the fields partial, final, eouUpdate, finalRefinement, statusCode, classifierUpdate, speakerAnalysis, conversationAnalysis, summarization.

channelTag

string

Tag for distinguish audio channels.

SessionUuid
Session identifier.

Field

Description

uuid

string

Internal session identifier.

userRequestId

string

User session identifier.

AudioCursors
AudioCursors are state of ASR recognition stream.

Field

Description

receivedDataMs

string (int64)

Amount of audio chunks server received. This cursor is moved after each audio chunk was received by server.

resetTimeMs

string (int64)

Input stream reset data.

partialTimeMs

string (int64)

How much audio was processed. This time includes trimming silences as well.
This cursor is moved after server received enough data to update recognition results (includes silence as well).

finalTimeMs

string (int64)

Time of last final. This cursor is moved when server decides that recognition from start of audio until final_time_ms will not change anymore
usually this event is followed by EOU detection. This behavior could change in future.

finalIndex

string (int64)

This is index of last final server send. Incremented after each new final.

eouTimeMs

string (int64)

Estimated time of EOU. Cursor is updated after each new EOU is sent.
For external classifier this equals to receivedDataMs at the moment EOU event arrives.
For internal classifier this is estimation of time. The time is not exact and has the same guarantees as word timings.

AlternativeUpdate
Update of hypothesis.

Field

Description

alternatives[]

Alternative

List of hypothesis for timeframes.

channelTag

string

Alternative
Recognition of specific time frame.

Field

Description

words[]

Word

Words in time frame.

text

string

Text in time frame.

startTimeMs

string (int64)

Start of time frame.

endTimeMs

string (int64)

End of time frame.

confidence

string

The hypothesis confidence. Currently is not used.

languages[]

LanguageEstimation

Distribution over possible languages.

Word
Recognized word.

Field

Description

text

string

Word text.

startTimeMs

string (int64)

Estimation of word start time in ms.

endTimeMs

string (int64)

Estimation of word end time in ms.

LanguageEstimation
Estimation of language and its probability.

Field

Description

languageCode

string

Language tag in IETF BCP 47 format, consisting of ISO 639-1 language code and ISO 3166-1 country code (e.g., en-US, ru-RU).

probability

string

Estimation of language probability.

EouUpdate
Update information for external End of Utterance.

Field

Description

timeMs

string (int64)

EOU estimated time.

FinalRefinement
Refinement for final hypo. For example, text normalization is refinement.

Field

Description

finalIndex

string (int64)

Index of final for which server sends additional information.

normalizedText

AlternativeUpdate

Normalized text instead of raw one.

Includes only one of the fields normalizedText.

Type of refinement.

StatusCode
Status message.

Field

Description

codeType

enum (CodeType)

Code type.

CODE_TYPE_UNSPECIFIED
WORKING: All good.
WARNING: For example, if speech is sent not in real-time or context is unknown and we've made fallback.
CLOSED: After session was closed.
message

string

Human readable message.

RecognitionClassifierUpdate
Field

Description

windowType

enum (WindowType)

Response window type.

WINDOW_TYPE_UNSPECIFIED
LAST_UTTERANCE: The result of applying the classifier to the last utterance response.
LAST_FINAL: The result of applying the classifier to the last final response.
LAST_PARTIAL: The result of applying the classifier to the last partial response.
startTimeMs

string (int64)

Start time of the audio segment used for classification.

endTimeMs

string (int64)

End time of the audio segment used for classification.

classifierResult

RecognitionClassifierResult

Result for dictionary-based classifier.

RecognitionClassifierResult
Field

Description

classifier

string

Name of the triggered classifier.

highlights[]

PhraseHighlight

List of highlights, i.e. parts of phrase that determine the result of the classification.

labels[]

RecognitionClassifierLabel

Classifier predictions.

PhraseHighlight
Field

Description

text

string

Text transcription of the highlighted audio segment.

startTimeMs

string (int64)

Start time of the highlighted audio segment.

endTimeMs

string (int64)

End time of the highlighted audio segment.

RecognitionClassifierLabel
Field

Description

label

string

The label of the class predicted by the classifier.

confidence

string

The prediction confidence.

SpeakerAnalysis
Field

Description

speakerTag

string

Speaker tag.

windowType

enum (WindowType)

Response window type.

WINDOW_TYPE_UNSPECIFIED
TOTAL: Stats for all received audio.
LAST_UTTERANCE: Stats for last utterance.
speechBoundaries

AudioSegmentBoundaries

Audio segment boundaries.

totalSpeechMs

string (int64)

Total speech duration.

speechRatio

string

Speech ratio within audio segment.

totalSilenceMs

string (int64)

Total duration of silence.

silenceRatio

string

Silence ratio within audio segment.

wordsCount

string (int64)

Number of words in recognized speech.

lettersCount

string (int64)

Number of letters in recognized speech.

wordsPerSecond

DescriptiveStatistics

Descriptive statistics for words per second distribution.

lettersPerSecond

DescriptiveStatistics

Descriptive statistics for letters per second distribution.

wordsPerUtterance

DescriptiveStatistics

Descriptive statistics for words per utterance distribution.

lettersPerUtterance

DescriptiveStatistics

Descriptive statistics for letters per utterance distribution.

utteranceCount

string (int64)

Number of utterances

utteranceDurationEstimation

DescriptiveStatistics

Descriptive statistics for utterance duration distribution

AudioSegmentBoundaries
Field

Description

startTimeMs

string (int64)

Audio segment start time.

endTimeMs

string (int64)

Audio segment end time.

DescriptiveStatistics
Field

Description

min

string

Minimum observed value.

max

string

Maximum observed value.

mean

string

Estimated mean of distribution.

std

string

Estimated standard deviation of distribution.

quantiles[]

Quantile

List of evaluated quantiles.

Quantile
Field

Description

level

string

Quantile level in range (0, 1).

value

string

Quantile value.

ConversationAnalysis
Field

Description

conversationBoundaries

AudioSegmentBoundaries

Audio segment boundaries.

totalSimultaneousSilenceDurationMs

string (int64)

Total simultaneous silence duration.

totalSimultaneousSilenceRatio

string

Simultaneous silence ratio within audio segment.

simultaneousSilenceDurationEstimation

DescriptiveStatistics

Descriptive statistics for simultaneous silence duration distribution.

totalSimultaneousSpeechDurationMs

string (int64)

Total simultaneous speech duration.

totalSimultaneousSpeechRatio

string

Simultaneous speech ratio within audio segment.

simultaneousSpeechDurationEstimation

DescriptiveStatistics

Descriptive statistics for simultaneous speech duration distribution.

speakerInterrupts[]

InterruptsEvaluation

Interrupts description for every speaker.

totalSpeechDurationMs

string (int64)

Total speech duration, including both simultaneous and separate speech.

totalSpeechRatio

string

Total speech ratio within audio segment.

InterruptsEvaluation
Field

Description

speakerTag

string

Speaker tag.

interruptsCount

string (int64)

Number of interrupts made by the speaker.

interruptsDurationMs

string (int64)

Total duration of all interrupts.

interrupts[]

AudioSegmentBoundaries

Boundaries for every interrupt.

Summarization
Field

Description

results[]

SummarizationPropertyResult

A list of summarizations of transcription.

contentUsage

ContentUsage

A set of statistics describing the number of content tokens used by the completion model.

SummarizationPropertyResult
Represents summarization response entry for transcription.

Field

Description

response

string

Summarization response text.

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

SpeechKit Recognition API v3, REST: AsyncRecognizer.DeleteRecognition
Статья создана

Yandex Cloud
Обновлена 3 октября 2025 г.
Deletes results of asynchronous recognition by operation ID.

HTTP request
DELETE https://stt.api.cloud.yandex.net/stt/v3/deleteRecognition

Query parameters
Field

Description

operationId

string


SpeechKit Recognition API v3, REST: Operation
Статья создана

Yandex Cloud
Обновлена 17 октября 2024 г.
A set of methods for managing operations for asynchronous API requests.

Methods
Method

Description

Get

Returns the specified Operation resource.

Cancel

Cancels the specified operation.


SpeechKit Recognition API v3, REST: Operation.Get
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

SpeechKit Recognition API v3, REST: Operation.Cancel
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